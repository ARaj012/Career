import type { Metadata } from 'next'
import Link from 'next/link'
import LegalPage, { Contact, type LegalSection } from '@/components/legal/LegalPage'
import { BRAND_NAME } from '@/lib/brand'

export const metadata: Metadata = {
  title: `Privacy Policy | ${BRAND_NAME}`,
  description: `What ${BRAND_NAME} collects when you use it, why, who it is shared with, and how to see, change or delete your data.`,
  alternates: { canonical: '/privacy' },
}

const sections: LegalSection[] = [
  {
    id: 'collect',
    label: 'What we collect',
    title: 'What we collect',
    body: (
      <>
        <p>You can browse careers, colleges, exams and scholarships without an account. We only collect personal details when you sign in or use a feature that needs them.</p>
        <ul>
          <li><strong>From Google, when you sign in:</strong> your name, email address and profile photo. We never see your Google password.</li>
          <li><strong>Your profile, if you fill it in:</strong> class, stream, board, subjects and marks, your state, the exams you are aiming for, career goals and preferences, and budget range.</li>
          <li><strong>What you do with your account:</strong> careers, colleges and exams you save or track, your past career matches, your notifications and email reminder setting.</li>
          <li><strong>College reviews you write:</strong> the rating and text, shown publicly with your name.</li>
          <li><strong>Payments:</strong> if paid plans are switched on, the plan, amount and payment reference. Card, UPI and bank details go straight to the payment provider; we never see or store them.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'use',
    label: 'How we use it',
    title: 'How we use it',
    body: (
      <ul>
        <li>To run your account and keep your saved items, tracked exams and history.</li>
        <li>To suggest careers, colleges and scholarships that fit your profile.</li>
        <li>To remind you about dates for exams you track, in the app and by email.</li>
        <li>To keep the site safe, for example limiting how fast messages can be sent to the chat assistant.</li>
      </ul>
    ),
  },
  {
    id: 'ai',
    label: 'AI features',
    title: 'The chat assistant and AI advice',
    body: (
      <>
        <p>The chat assistant and the career advice on the career-match page are answered by an AI model run by <strong>Groq</strong>. What you type into the chat, and the subjects, marks, interests and preferences you enter for advice, are sent to Groq to produce the answer. {BRAND_NAME} does not save your chat messages.</p>
        <p>Please don&apos;t type private details such as phone numbers, addresses or ID numbers into the chat. AI answers can be wrong, so check anything important on the official website.</p>
      </>
    ),
  },
  {
    id: 'sharing',
    label: 'Who sees it',
    title: 'Who we share it with',
    body: (
      <>
        <p>We do not sell your data and we do not show ads. We only share what each service needs to do its job for us:</p>
        <ul>
          <li><strong>Supabase</strong> stores the database and handles sign-in.</li>
          <li><strong>Google</strong> confirms who you are when you sign in.</li>
          <li><strong>Groq</strong> answers the chat assistant and AI advice (see above).</li>
          <li><strong>Brevo</strong> sends exam reminder emails to your email address.</li>
          <li><strong>Razorpay</strong> would handle payments if paid plans are switched on. Right now payments run in test mode and no money is taken.</li>
        </ul>
        <p>The {BRAND_NAME} team can see account details to run the site and handle problems. We will share data with authorities only when the law requires it.</p>
      </>
    ),
  },
  {
    id: 'cookies',
    label: 'Cookies',
    title: 'Cookies and browser storage',
    body: (
      <>
        <p>We use cookies only to keep you signed in. There are no advertising or tracking cookies.</p>
        <p>The <Link href="/scholarships/match">scholarship matcher</Link> keeps your answers (such as category, income range and state) in your own browser so you don&apos;t have to type them again. They are not sent to us, and its &ldquo;Reset&rdquo; button clears them.</p>
      </>
    ),
  },
  {
    id: 'emails',
    label: 'Emails',
    title: 'Emails from us',
    body: (
      <p>If you track exams, we send at most one reminder email a day when a date you care about is close. You can turn these off on <Link href="/my-exams">My exams</Link>, or with the unsubscribe link in any reminder email. We don&apos;t send marketing emails.</p>
    ),
  },
  {
    id: 'choices',
    label: 'Your choices',
    title: 'Seeing, changing and deleting your data',
    body: (
      <>
        <ul>
          <li>See and edit your details on your <Link href="/profile">profile</Link>.</li>
          <li>Remove saved items on <Link href="/saved">Saved</Link>, and delete past matches on <Link href="/recommendation-history">Recommendation history</Link>.</li>
          <li>To get a copy of your data, or to delete your account and everything linked to it, write to <Contact />. We will do it within 30 days.</li>
        </ul>
        <p>We keep your data while your account is open. When you ask us to delete your account, we remove your profile, saved items, history and reviews.</p>
      </>
    ),
  },
  {
    id: 'children',
    label: 'Under 18',
    title: 'Students under 18',
    body: (
      <p>Many of our users are school students. If you are under 18, please use {BRAND_NAME} with the knowledge and consent of a parent or guardian. A parent or guardian can write to <Contact /> to see or delete their child&apos;s data.</p>
    ),
  },
  {
    id: 'security',
    label: 'Security',
    title: 'Keeping it safe',
    body: (
      <p>Your data is sent over encrypted connections, and the database only lets each student read and change their own records. No system is perfectly secure, but if we ever find a problem that affects your data, we will tell you.</p>
    ),
  },
  {
    id: 'changes',
    label: 'Changes',
    title: 'Changes and contact',
    body: (
      <p>If we change this policy, we will update the date at the top, and tell signed-in students about important changes. Questions or complaints about your data: write to <Contact />.</p>
    ),
  },
]

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="26 November 2026"
      intro={<p>{BRAND_NAME} helps students find careers, colleges, exams and scholarships. This page explains, in plain words, what we collect when you use it, why, and what you can do about it.</p>}
      sections={sections}
      other={{ href: '/terms', label: 'Terms of Use' }}
    />
  )
}
