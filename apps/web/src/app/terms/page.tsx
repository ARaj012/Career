import type { Metadata } from 'next'
import Link from 'next/link'
import LegalPage, { Contact, type LegalSection } from '@/components/legal/LegalPage'
import { BRAND_NAME } from '@/lib/brand'

export const metadata: Metadata = {
  title: `Terms of Use | ${BRAND_NAME}`,
  description: `The rules for using ${BRAND_NAME}: what the information is for, your account, reviews, paid plans and our responsibilities.`,
  alternates: { canonical: '/terms' },
}

const sections: LegalSection[] = [
  {
    id: 'about',
    label: 'What this is',
    title: `What ${BRAND_NAME} is`,
    body: (
      <>
        <p>{BRAND_NAME} is a free guide for students choosing careers, colleges, entrance exams and scholarships. We are not a government body, exam board, college or scholarship provider, and we are not linked to any of them.</p>
        <p>By using {BRAND_NAME} you agree to these terms. If you don&apos;t agree, please don&apos;t use the site.</p>
      </>
    ),
  },
  {
    id: 'information',
    label: 'Information',
    title: 'Check official sources before you act',
    body: (
      <>
        <p>We take exam dates, fees, cutoffs, placements and scholarship rules from official sources, and we mark figures that are estimates. But these change often, and mistakes can happen.</p>
        <ul>
          <li>Always confirm dates, eligibility, fees and rules on the official website before you apply, register or pay.</li>
          <li>Career matches, scholarship matches and AI answers are suggestions, not promises. They don&apos;t guarantee admission, a scholarship, a job or a salary.</li>
          <li>Links to official and other websites are there to help you. We don&apos;t control those sites.</li>
        </ul>
        <p>If you spot something wrong, please tell us at <Contact />.</p>
      </>
    ),
  },
  {
    id: 'account',
    label: 'Your account',
    title: 'Your account',
    body: (
      <>
        <p>You sign in with your Google account. Keep it secure, use your own account only, and give honest details in your profile so the suggestions fit you.</p>
        <p>If you are under 18, use {BRAND_NAME} with the knowledge and consent of a parent or guardian.</p>
        <p>How we handle your data is explained in our <Link href="/privacy">Privacy Policy</Link>.</p>
      </>
    ),
  },
  {
    id: 'conduct',
    label: 'Fair use',
    title: 'Fair use and reviews',
    body: (
      <>
        <p>Please don&apos;t:</p>
        <ul>
          <li>post fake, abusive, hateful or misleading reviews, or anyone&apos;s personal details;</li>
          <li>copy the site&apos;s content in bulk, or use bots to scrape it;</li>
          <li>try to break, overload or get around the site&apos;s security or limits;</li>
          <li>use the chat assistant for anything harmful or illegal.</li>
        </ul>
        <p>College reviews should be your own honest experience. Reviews are shown with your name, and we may remove any review that breaks these rules. We may also suspend accounts that misuse the site.</p>
      </>
    ),
  },
  {
    id: 'plans',
    label: 'Paid plans',
    title: 'Paid plans',
    body: (
      <p>Most of {BRAND_NAME} is free. The <Link href="/pricing">Pricing</Link> page shows optional paid plans. Right now payments run in test mode and no money is taken. Before real payments start, we will add billing and refund terms here, and the price and what you get will be shown before you pay.</p>
    ),
  },
  {
    id: 'content',
    label: 'Content',
    title: 'Who owns the content',
    body: (
      <p>The site&apos;s design, text and tools belong to {BRAND_NAME}. Official documents such as question papers, notices and guidelines belong to the bodies that publish them; we link to them or show them for students&apos; reference. You can use what you find here for your own study and planning.</p>
    ),
  },
  {
    id: 'liability',
    label: 'Responsibility',
    title: 'Our responsibility',
    body: (
      <p>We work hard to keep {BRAND_NAME} accurate and running, but we provide it &ldquo;as is&rdquo;. As far as the law allows, we are not responsible for losses from relying on information here without checking the official source, or from the site being unavailable. Nothing in these terms takes away rights you have under Indian law.</p>
    ),
  },
  {
    id: 'changes',
    label: 'Changes',
    title: 'Changes and contact',
    body: (
      <p>We may update these terms as {BRAND_NAME} grows. We will change the date at the top when we do, and tell signed-in students about important changes. These terms follow the laws of India. Questions: write to <Contact />.</p>
    ),
  },
]

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Use"
      updated="26 November 2026"
      intro={<p>These are the simple rules for using {BRAND_NAME}. Please read them, especially the part about checking official sources.</p>}
      sections={sections}
      other={{ href: '/privacy', label: 'Privacy Policy' }}
    />
  )
}
