import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Cancellation & Refund Policy",
  description: "Cancellation, failed payment and refund rules for Tryren VIP access.",
};

export default function CancellationPolicyPage() {
  return (
    <LegalPage
      title="Cancellation & Refund Policy"
      summary="This policy explains how to cancel a VIP purchase, when a refund is available and how long approved refunds normally take."
    >
      <section>
        <h2>1. Digital service and pricing</h2>
        <p>
          Tryren provides a digital matchmaking service; no physical product is shipped. VIP access is
          currently displayed at ₹99 for the access period shown on the Membership &amp; Plans page and at
          checkout. The final amount and billing arrangement are shown before you authorise payment.
        </p>
      </section>

      <section>
        <h2>2. Cancelling before payment</h2>
        <p>
          You may close or dismiss the Razorpay checkout before authorising payment. If payment is not
          completed, you will not be charged and no cancellation fee applies.
        </p>
      </section>

      <section>
        <h2>3. Cancelling VIP access</h2>
        <p>
          To cancel VIP access or any future renewal that was explicitly authorised at checkout, email
          <a href="mailto:admin@tryren.in"> admin@tryren.in</a> from your registered email address at
          least two business days before the next displayed billing date. Include your registered email,
          phone number and Razorpay payment ID. We will confirm cancellation by email. Cancellation stops
          future charges; access already paid for normally continues until the end of the current access period.
        </p>
        <p>
          A checkout that does not ask you to approve recurring payments will not create an automatic debit.
          Deleting the app or stopping use does not itself cancel an explicitly authorised recurring payment.
        </p>
      </section>

      <section>
        <h2>4. Refund eligibility</h2>
        <p>You may request a refund within seven calendar days of payment when:</p>
        <ul>
          <li>the same purchase was charged more than once;</li>
          <li>payment succeeded but VIP access was not activated within 24 hours;</li>
          <li>Tryren was unable to provide the paid service because of a verified technical issue; or</li>
          <li>a refund is required under applicable consumer law.</li>
        </ul>
        <p>
          Except in these cases, payments for digital access are non-refundable once VIP features have
          been used or a weekly match has been processed. We do not issue refunds merely because no match
          was available, a user did not like a match, another user did not respond, or the account was
          suspended for breaching our Terms &amp; Conditions.
        </p>
      </section>

      <section>
        <h2>5. How to request a refund</h2>
        <p>
          Email <a href="mailto:admin@tryren.in">admin@tryren.in</a> with the subject &quot;Refund request&quot;.
          Include your registered email and phone number, payment date, amount, Razorpay payment ID and
          reason. We may request information needed to verify the transaction. We normally review a
          complete request within three business days.
        </p>
      </section>

      <section>
        <h2>6. Refund and failed-payment timelines</h2>
        <p>
          An approved refund is initiated to the original payment method within five business days. Your
          bank or payment provider may take a further five to seven business days to reflect it. We cannot
          send a refund to a different account. If money is debited for a failed or pending transaction,
          Razorpay or your bank will usually reverse it automatically within five to seven business days.
          Contact us if it has not been reversed after seven business days.
        </p>
      </section>

      <section>
        <h2>7. Chargebacks and contact</h2>
        <p>
          Please contact us first so we can investigate promptly. This does not restrict your right to
          contact your bank or payment provider. Questions about cancellations or refunds can be sent to
          <a href="mailto:admin@tryren.in"> admin@tryren.in</a>.
        </p>
      </section>
    </LegalPage>
  );
}
