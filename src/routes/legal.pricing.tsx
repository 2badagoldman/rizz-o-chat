import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalDoc, Section, Bullets } from "@/components/LegalDoc";
import { LEGAL } from "@/lib/legal";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/legal/pricing")({
  head: () => pageHead({
    path: "/legal/pricing",
    title: "Pricing for Products & Services \u2014 Rizzla Chat",
    description: "Full price list for Rizzla Chat: coin packs from $4.99, Rizz Gold and Rizz Diamond VIP weekly memberships, host Friends List memberships, and tips \u2014 all in USD with taxes shown at checkout.",
    type: "article",
  }) => (
            <tr key={r.a} className="border-t border-border/70">
              <td className="px-3 py-2.5 font-semibold text-foreground">{r.a}</td>
              <td className="px-3 py-2.5 text-muted-foreground">{r.b}</td>
              <td className="px-3 py-2.5 text-right font-bold text-foreground">{r.c}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Pricing() {
  return (
    <LegalDoc
      title="Pricing for products and services"
      subtitle={`Every price on ${LEGAL.productName} is listed below in ${LEGAL.currency}. Applicable sales tax or VAT is calculated and shown before you pay. There are no hidden or setup fees, and creating an account is free.`}
    >
      <Section heading="1. Coin packs (one-time purchase)">
        <p>
          Coins are a prepaid in-app credit used to send gifts, unlock premium chats and tip hosts. They are a licence to
          use in-app features — not cash, not a stored-value account, and not transferable or withdrawable.
        </p>
        <Table
          head={["Pack", "You receive", "Price"]}
          rows={COINS.map((c) => ({ a: c.name, b: c.coins, c: c.price }))}
        />
      </Section>

      <Section heading="2. Platform memberships (recurring)">
        <p>
          Memberships renew automatically each month at the price shown until cancelled. You can cancel at any time from{" "}
          <Link to="/subscriptions" className="font-semibold text-primary">
            My subscriptions
          </Link>
          , and access continues to the end of the period you already paid for.
        </p>
        <Table head={["Plan", "Billing", "Price"]} rows={PLANS.map((p) => ({ a: p.name, b: p.billing, c: p.price }))} />
      </Section>

      <Section heading="3. Host Friends List memberships (recurring)">
        <Bullets
          items={[
            "Each host sets their own monthly Friends List price between $0.99 and $99.99 USD.",
            "The exact price is always displayed on that host's profile and on the checkout screen before payment.",
            "Some hosts offer free access, and hosts may grant complimentary access to people they add or invite directly.",
            "Friends List memberships renew monthly until cancelled, and can be cancelled at any time from My subscriptions.",
          ]}
        />
      </Section>

      <Section heading="4. Tips and gifts (one-time)">
        <Bullets
          items={[
            "Tips are chosen by you at the time of payment, from $1.00 to $500.00 USD per transaction.",
            "In-app gifts are paid for with coins at the coin price shown next to each gift.",
            "Tips and delivered gifts are voluntary, final and non-refundable once sent.",
          ]}
        />
      </Section>

      <Section heading="5. Taxes, currency and card statements">
        <Bullets
          items={[
            `All prices are in ${LEGAL.currency} and exclude tax unless stated. Sales tax, VAT or GST is calculated at checkout based on your location and shown before you confirm payment.`,
            `Your card or bank statement will show ${LEGAL.statementDescriptor}.`,
            "Your bank may apply its own currency-conversion or foreign-transaction fee, which we do not control or receive.",
            "We may change prices at any time. For recurring plans we give notice before a price change takes effect, and you may cancel before the new price applies.",
          ]}
        />
      </Section>

      <Section heading="6. Related policies">
        <Bullets
          items={[
            <>
              <Link to="/legal/billing" className="font-semibold text-primary">
                Billing &amp; Payment Terms
              </Link>{" "}
              — how and when you are charged, renewals and failed payments.
            </>,
            <>
              <Link to="/legal/refunds" className="font-semibold text-primary">
                Refund &amp; Cancellation Policy
              </Link>{" "}
              — the {LEGAL.refundWindowDays}-day window for unused purchases and how to cancel.
            </>,
            <>
              Pricing questions? Email{" "}
              <a className="font-semibold text-primary" href={`mailto:${LEGAL.supportEmail}`}>
                {LEGAL.supportEmail}
              </a>
              .
            </>,
          ]}
        />
      </Section>
    </LegalDoc>
  );
}
