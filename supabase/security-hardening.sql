-- Security hardening (2026-11-01). Safe to re-run.
--
-- 1. Students could give themselves a paid plan: user_subscriptions let a
--    signed-in user insert/update their own row with any plan_id/status, straight
--    through the REST API. A trigger now limits what a non-service caller may
--    change: create a free row, toggle cancel_at_period_end, or drop to free.
--    Paid plans are written only by the server (service role) after payment.
-- 2. user_usage: users could reset their own usage counters. Now read-only for
--    users; increment_usage runs as definer and only for the caller.
-- 3. payment_history: users could insert their own "completed" payments. The
--    server writes these with the service role now.
-- 4. user_accounts: own-row read only (writes stay with the service role).
-- 5. Advisor fixes: security-definer views, mutable search_path, and
--    handle_new_auth_user callable over RPC.

-- 1. user_subscriptions ----------------------------------------------------
create or replace function public.guard_user_subscription_write()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  -- The server (service role) and database owners may write anything.
  if coalesce(auth.role(), '') = 'service_role'
     or current_user not in ('authenticated', 'anon') then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.plan_id is distinct from 'free' then
      raise exception 'Paid plans can only be set by the server after payment'
        using errcode = '42501';
    end if;
    return new;
  end if;

  if new.user_id is distinct from old.user_id then
    raise exception 'Cannot move a subscription to another user' using errcode = '42501';
  end if;

  -- Dropping to the free plan is always allowed.
  if new.plan_id = 'free' then
    return new;
  end if;

  -- Otherwise only the cancel flag (and updated_at) may change.
  if new.plan_id is distinct from old.plan_id
     or new.status is distinct from old.status
     or new.billing_cycle is distinct from old.billing_cycle
     or new.current_period_start is distinct from old.current_period_start
     or new.current_period_end is distinct from old.current_period_end
     or new.razorpay_subscription_id is distinct from old.razorpay_subscription_id
     or new.razorpay_customer_id is distinct from old.razorpay_customer_id
     or new.payment_method is distinct from old.payment_method
     or new.metadata is distinct from old.metadata then
    raise exception 'Subscription changes are made by the server after payment'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists guard_user_subscription_write on public.user_subscriptions;
create trigger guard_user_subscription_write
  before insert or update on public.user_subscriptions
  for each row execute function public.guard_user_subscription_write();

revoke execute on function public.guard_user_subscription_write() from public, anon, authenticated;

-- 2. user_usage ------------------------------------------------------------
drop policy if exists "Users can manage own usage" on public.user_usage;
drop policy if exists "Users can read own usage" on public.user_usage;
create policy "Users can read own usage"
  on public.user_usage for select
  using (auth.uid() = user_id);

-- Same logic as before, now as definer (users can no longer write user_usage)
-- and only for the caller's own user id.
create or replace function public.increment_usage(p_user_id uuid, p_feature_type text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_usage integer;
  v_limit integer;
  v_plan_id text;
begin
  if coalesce(auth.role(), '') <> 'service_role' and p_user_id is distinct from auth.uid() then
    raise exception 'Can only count usage for yourself' using errcode = '42501';
  end if;

  select plan_id into v_plan_id
  from public.user_subscriptions
  where user_id = p_user_id and status = 'active'
  limit 1;

  if v_plan_id is null then
    v_plan_id := 'free';
  end if;

  select (features->p_feature_type)::integer into v_limit
  from public.subscription_plans
  where id = v_plan_id;

  if v_limit = -1 then
    return -1;
  end if;

  select usage_count into v_usage
  from public.user_usage
  where user_id = p_user_id
    and feature_type = p_feature_type
    and period_start = date_trunc('month', now());

  if v_usage is null then
    insert into public.user_usage (user_id, feature_type, usage_count)
    values (p_user_id, p_feature_type, 1)
    on conflict (user_id, feature_type, period_start)
    do update set usage_count = user_usage.usage_count + 1;
    return 1;
  end if;

  if v_usage >= v_limit then
    return v_limit;
  end if;

  update public.user_usage
  set usage_count = usage_count + 1,
      updated_at = now()
  where user_id = p_user_id
    and feature_type = p_feature_type
    and period_start = date_trunc('month', now());

  return v_usage + 1;
end;
$$;
revoke execute on function public.increment_usage(uuid, text) from public, anon;
grant execute on function public.increment_usage(uuid, text) to authenticated, service_role;

-- 3. payment_history -------------------------------------------------------
drop policy if exists "Users can insert own payment history" on public.payment_history;

-- 4. user_accounts ---------------------------------------------------------
drop policy if exists "Users can read own account" on public.user_accounts;
create policy "Users can read own account"
  on public.user_accounts for select
  using (auth.uid() = user_id);

-- 5. Advisor fixes ---------------------------------------------------------
alter view public.college_scholarships_detail set (security_invoker = true);
alter view public.college_scholarship_counts set (security_invoker = true);

alter function public.update_tracked_exam_statuses() set search_path = public;
alter function public.generate_exam_notifications() set search_path = public;
alter function public.get_usage(uuid, text) set search_path = public;
alter function public.has_feature_access(uuid, text) set search_path = public;
alter function public.create_free_subscription(uuid) set search_path = public;
alter function public.calculate_exam_status(uuid, timestamp with time zone) set search_path = public;

-- Trigger function only; nobody should call it over /rest/v1/rpc.
revoke execute on function public.handle_new_auth_user() from public, anon, authenticated;

-- Batch jobs, not for the browser.
revoke execute on function public.update_tracked_exam_statuses() from public, anon, authenticated;
revoke execute on function public.generate_exam_notifications() from public, anon, authenticated;

-- Signed-in only.
revoke execute on function public.create_free_subscription(uuid) from public, anon;
revoke execute on function public.get_usage(uuid, text) from public, anon;
revoke execute on function public.has_feature_access(uuid, text) from public, anon;
grant execute on function public.create_free_subscription(uuid) to authenticated, service_role;
grant execute on function public.get_usage(uuid, text) to authenticated, service_role;
grant execute on function public.has_feature_access(uuid, text) to authenticated, service_role;
