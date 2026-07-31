import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Tryren collects, uses, shares and protects personal data.",
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      summary="This policy explains what personal data Tryren collects, why we use it, when it is shared and the choices available to you."
    >
      <section>
        <h2>1. Scope and contact</h2>
        <p>
          This policy applies to the Tryren website, application, WhatsApp onboarding and related
          matchmaking, support and payment services. Tryren is responsible for the personal data it
          processes for these services. Privacy requests and grievances can be sent to the Grievance
          Officer at <a href="mailto:admin@tryren.in">admin@tryren.in</a>.
        </p>
      </section>

      <section>
        <h2>2. Data we collect</h2>
        <ul>
          <li>Account and verification data, such as name, email address, phone number, one-time passcode status, user type, college and invite information.</li>
          <li>Profile and preference data, such as date of birth, city, gender identity and preferences, photos, bio, height, interests, relationship goals, religion, politics, family preferences and smoking or drinking choices.</li>
          <li>Match and communication data, such as weekly opt-ins, match selections, support requests, email and WhatsApp delivery records and reports about another user.</li>
          <li>Payment records, such as order ID, payment status, amount, plan and timestamps. Complete card, bank and UPI credentials are collected by Razorpay and are not stored by Tryren.</li>
          <li>Technical and usage data, such as IP address, device and browser details, pages viewed, cookies, error logs, analytics events and approximate location inferred from network information.</li>
        </ul>
        <p>We receive data directly from you, from your use of Tryren and from service providers that process authentication, communications, analytics, hosting and payments for us.</p>
      </section>

      <section>
        <h2>3. How we use data</h2>
        <ul>
          <li>create and secure your account, verify eligibility and complete onboarding;</li>
          <li>display your profile, apply preferences, operate weekly matchmaking and provide match contact details;</li>
          <li>process and verify payments, activate VIP access and maintain transaction records;</li>
          <li>send OTPs, match notices, service updates and support responses through email, SMS or WhatsApp;</li>
          <li>prevent fraud, investigate reports, enforce our terms and protect users; and</li>
          <li>monitor performance, fix errors, understand feature use and comply with legal obligations.</li>
        </ul>
        <p>
          We process data to provide the service you request, based on your consent where required,
          for legitimate safety and operational purposes, and to comply with law. You may withdraw
          consent, but some features may then be unavailable.
        </p>
      </section>

      <section>
        <h2>4. When we share data</h2>
        <ul>
          <li>With a selected match: profile information and, after a match is confirmed, the contact details needed for you to connect. We do not make your profile publicly searchable on the open web.</li>
          <li>With processors: hosting and storage providers, Razorpay, email and WhatsApp/SMS providers, analytics, error monitoring and customer-support providers, only as needed to perform services for us.</li>
          <li>For legal and safety reasons: regulators, courts, law enforcement or advisers where required by law or reasonably necessary to protect rights, users and the public.</li>
          <li>For a business transfer: a successor in a merger, financing, reorganisation or sale, subject to appropriate confidentiality and notice requirements.</li>
        </ul>
        <p>We do not sell personal data. We do not permit payment providers or other processors to use your data for their own unrelated marketing on our behalf.</p>
      </section>

      <section>
        <h2>5. Cookies and external services</h2>
        <p>
          Tryren uses essential cookies for sign-in and security, and may use analytics and support
          technologies to understand usage and respond to questions. You can restrict non-essential
          cookies through browser controls, although essential account features may stop working.
          Links or services operated by third parties have their own privacy practices.
        </p>
      </section>

      <section>
        <h2>6. Retention and deletion</h2>
        <p>
          We keep account and profile data while your account is active and for as long as reasonably
          needed to provide the service. After an account deletion request, we delete or anonymise data
          unless retention is required for fraud prevention, disputes, payment and tax records, safety
          investigations or other legal obligations. Backup copies are removed on the ordinary backup
          cycle. Payment records may be retained for up to eight years where required by law.
        </p>
      </section>

      <section>
        <h2>7. Security and international processing</h2>
        <p>
          We use reasonable administrative, technical and organisational safeguards, including access
          controls and secure transmission. No online service is completely secure, so please use care
          when sharing information. Some providers may process data outside your state or India, subject
          to applicable law and contractual safeguards.
        </p>
      </section>

      <section>
        <h2>8. Your rights</h2>
        <p>
          Subject to applicable law, including India&apos;s Digital Personal Data Protection Act, 2023,
          you may request access to a summary of your data and processing, correction or completion,
          erasure, withdrawal of consent and grievance redressal. You may also nominate another person
          to exercise rights where the law permits. Email us from your registered address; we may verify
          your identity before acting. You may escalate unresolved complaints to the Data Protection
          Board of India when that remedy is available.
        </p>
      </section>

      <section>
        <h2>9. Adults only and policy updates</h2>
        <p>
          Tryren is only for people aged 18 or older. We do not knowingly collect data from children.
          If you believe a child has provided data, contact us for removal. We may update this policy
          as our practices or laws change. We will post the new date and provide additional notice for
          material changes where required.
        </p>
      </section>
    </LegalPage>
  );
}
