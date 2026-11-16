import * as React from "react";
import { Body, Button, Container, Head, Heading, Hr, Html, Preview, Section, Text } from "@react-email/components";
import type { TemplateEntry } from "./registry";

interface Props {
  name?: string; orderNumber?: string; courier?: string; trackingNumber?: string; trackUrl?: string;
  statusLink?: string; items?: string[]; corrected?: boolean;
}

function OrderShipped({ name, orderNumber, courier = "the courier", trackingNumber, trackUrl, statusLink, items = [], corrected }: Props) {
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{corrected ? `Updated tracking number for order ${orderNumber ?? ""}` : `Order ${orderNumber ?? ""} has shipped — track it with ${courier}`}</Preview>
      <Body style={s.body}>
        <Container style={s.container}>
          <Text style={s.brand}>KOPI MALAY × ROUTE 1</Text>
          <Heading style={s.heading}>{corrected ? "Updated tracking number" : "Your order has shipped!"}</Heading>
          <Text>{name ? `Hi ${name},` : "Hi there,"}</Text>
          <Text>
            {corrected
              ? <>We've corrected the tracking number for order <strong>{orderNumber}</strong>. Please use the new number below — the earlier one won't show your parcel.</>
              : <>Good news — order <strong>{orderNumber}</strong> has left our shop in Tak and is on its way to you with <strong>{courier}</strong>.</>}
          </Text>
          <Section style={s.box}>
            <Text style={s.label}>Courier</Text>
            <Text style={s.value}>{courier}</Text>
            <Text style={s.label}>Tracking number</Text>
            <Text style={s.tracking}>{trackingNumber}</Text>
            {trackUrl && <Button href={trackUrl} style={s.button}>Track on {courier}</Button>}
          </Section>
          <Text style={s.muted}>The first courier scan can take up to 24 hours to appear. Delivery updates come straight from {courier}, so you can check anytime without messaging us.</Text>
          {items.length > 0 && (
            <>
              <Hr style={s.hr} />
              <Text style={s.label}>In this parcel</Text>
              {items.map((i, idx) => <Text key={idx} style={s.item}>• {i}</Text>)}
            </>
          )}
          {statusLink && (
            <>
              <Hr style={s.hr} />
              <Text style={s.muted}>See your full order anytime (keep this link private): <a href={statusLink} style={s.link}>View order status</a></Text>
            </>
          )}
        </Container>
      </Body>
    </Html>
  );
}

const s = {
  body: { backgroundColor: "#ffffff", color: "#252525", fontFamily: "'DM Sans', Arial, sans-serif" },
  container: { maxWidth: "520px", padding: "32px 24px" },
  brand: { fontSize: "12px", fontWeight: 700, color: "#555555" },
  heading: { fontFamily: "'Space Grotesk', Arial, sans-serif", fontSize: "26px", fontWeight: 700 },
  box: { border: "2px solid #111111", borderRadius: "8px", padding: "16px 18px", margin: "16px 0" },
  label: { fontSize: "12px", color: "#555555", margin: "6px 0 0", textTransform: "uppercase" as const, letterSpacing: "0.05em" },
  value: { fontSize: "16px", fontWeight: 700, margin: "2px 0 0" },
  tracking: { fontFamily: "'Courier New', monospace", fontSize: "20px", fontWeight: 700, margin: "2px 0 14px", wordBreak: "break-all" as const },
  button: { backgroundColor: "#111111", color: "#ffffff", borderRadius: "6px", padding: "12px 20px", fontWeight: 700, textDecoration: "none" },
  item: { margin: "2px 0", fontSize: "14px" },
  hr: { borderColor: "#e5e5e5", margin: "20px 0" },
  muted: { color: "#555555", fontSize: "12px", lineHeight: "18px" },
  link: { color: "#111111", fontWeight: 700 },
};

export const template = {
  component: OrderShipped,
  subject: (d: Record<string, any>) => d["corrected"] ? `Updated tracking for order ${d["orderNumber"] ?? ""} — Kopi Malay` : `Order ${d["orderNumber"] ?? ""} has shipped — Kopi Malay`,
  displayName: "Order shipped (tracking number)",
  previewData: {
    name: "AHMAD BIN ALI", orderNumber: "KM-12345", courier: "J&T Express", trackingNumber: "630012345678",
    trackUrl: "https://www.jtexpress.my/tracking/630012345678", statusLink: "https://kopimalay.com/order-success?ref=KM-12345&t=example",
    items: ["Route 1 Official Jersey (Size L) × 1", "8×8cm Sticker × 3"], corrected: false,
  },
} satisfies TemplateEntry;
