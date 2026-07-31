import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "Terms governing use of Tryren and purchase of Tryren VIP access.",
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms & Conditions"
      summary="These terms govern your access to Tryren, our campus-focused social and matchmaking service, including the purchase and use of VIP access."
    >
      <section>
        <h2>1. About Tryren</h2>
        <p>
          Tryren (&quot;Tryren&quot;, &quot;we&quot;, &quot;us&quot; or &quot;our&quot;) provides a digital platform where eligible
          adults can create profiles, opt in to weekly matchmaking and, when matched, connect
          with another user. Tryren does not sell physical goods and does not provide escort,
          sexual or adult entertainment services.
        </p>
        <p>
          You can contact us at <a href="mailto:admin@tryren.in">admin@tryren.in</a>. These terms,
          our <a href="/privacy-policy">Privacy Policy</a> and our{" "}
          <a href="/cancellation-and-refund-policy">Cancellation &amp; Refund Policy</a> form the
          agreement between you and Tryren.
        </p>
      </section>

      <section>
        <h2>2. Eligibility and acceptance</h2>
        <p>
          You must be at least 18 years old, legally capable of entering into a contract under
          Indian law, and not prohibited from using the service. By creating an account, using
          Tryren or making a payment, you confirm that you meet these requirements and accept
          these terms. We may ask you to verify your age, identity, phone number, email address
          or college affiliation.
        </p>
      </section>

      <section>
        <h2>3. Accounts and profiles</h2>
        <ul>
          <li>Provide accurate, current information and use only your own identity and contact details.</li>
          <li>Keep access codes and account credentials confidential and notify us of unauthorised use.</li>
          <li>Do not create duplicate, fraudulent or misleading profiles or impersonate another person.</li>
          <li>You are responsible for your profile content and interactions with other users.</li>
        </ul>
      </section>

      <section>
        <h2>4. Matchmaking and user safety</h2>
        <p>
          Matches depend on available users, preferences, eligibility and weekly participation.
          Payment does not guarantee a match, compatibility, a response or any particular outcome.
          We do not conduct exhaustive background checks and do not endorse or guarantee any user.
          Use independent judgment, protect financial and personal information, and meet in public
          places. Report suspicious, abusive or unsafe conduct to us promptly.
        </p>
      </section>

      <section>
        <h2>5. Acceptable use</h2>
        <p>You must not use Tryren to:</p>
        <ul>
          <li>harass, threaten, stalk, exploit, discriminate against or defraud another person;</li>
          <li>solicit money, offer commercial sexual services, promote illegal activity or facilitate transactions for prohibited goods or services;</li>
          <li>upload unlawful, non-consensual, deceptive, infringing, obscene or malicious content;</li>
          <li>scrape profiles, send spam, bypass access controls, reverse engineer the service or interfere with its operation; or</li>
          <li>use another user&apos;s personal information outside the purpose for which it was shared.</li>
        </ul>
        <p>We may remove content and suspend or terminate accounts that breach these rules or create risk for users or the platform.</p>
      </section>

      <section>
        <h2>6. VIP access, pricing and payment</h2>
        <p>
          Basic access is free. VIP access is currently offered at ₹99 for the access period shown
          before payment and includes the features displayed on the Membership &amp; Plans page. Prices
          are in Indian rupees and include applicable taxes unless stated otherwise. Any price or
          billing frequency will be clearly presented before you authorise payment.
        </p>
        <p>
          Payments are processed through Razorpay or another disclosed payment provider. We do not
          receive or store your complete card, UPI or banking credentials. Your payment may also be
          governed by the payment provider&apos;s and your bank&apos;s terms. A payment is complete only after
          successful verification. For cancellations, duplicate charges, failed payments and refund
          timelines, see our <a href="/cancellation-and-refund-policy">Cancellation &amp; Refund Policy</a>.
        </p>
      </section>

      <section>
        <h2>7. User content and platform rights</h2>
        <p>
          You retain ownership of content you submit. You grant Tryren a limited, non-exclusive,
          worldwide licence to host, reproduce, adapt and display that content only as needed to
          operate, secure and improve the service. You confirm that you have the rights and consents
          needed to submit it. Tryren&apos;s software, brand, design and original content remain our property
          and may not be copied or commercially used without permission.
        </p>
      </section>

      <section>
        <h2>8. Availability, suspension and termination</h2>
        <p>
          We may change, maintain or discontinue features and cannot promise uninterrupted service.
          We may restrict or close an account for a legal requirement, safety concern, fraud, payment
          dispute or breach of these terms. You may stop using Tryren at any time and request account
          deletion by emailing us. Provisions that by nature should survive termination will continue.
        </p>
      </section>

      <section>
        <h2>9. Disclaimers and liability</h2>
        <p>
          To the extent permitted by law, Tryren is provided on an &quot;as available&quot; basis. We are not
          responsible for user conduct, off-platform interactions, compatibility or losses caused by
          information a user chooses to share. Nothing in these terms excludes liability or consumer
          rights that cannot legally be excluded. For other claims, our aggregate liability will not
          exceed the amount you paid Tryren in the three months before the event giving rise to the claim.
        </p>
      </section>

      <section>
        <h2>10. Governing law and changes</h2>
        <p>
          These terms are governed by the laws of India. Disputes are subject to the competent courts
          in India, without limiting any mandatory consumer forum rights. We may update these terms for
          legal, safety or service changes. Material changes will be communicated through the service
          or by email and will apply from the stated effective date.
        </p>
      </section>
    </LegalPage>
  );
}
