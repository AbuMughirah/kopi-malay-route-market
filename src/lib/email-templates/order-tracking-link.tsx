import * as React from "react";
import { Body, Button, Container, Head, Heading, Html, Preview, Text } from "@react-email/components";
import type { TemplateEntry } from "./registry";

interface Props { name?: string; orderNumber?: string; link?: string }

function OrderTrackingLink({ name, orderNumber, link }: Props) {
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{`Your private status link for order ${orderNumber ?? ""}`}</Preview>
      <Body style={s.body}>
        <Container style={s.container}>
          <Text style={s.brand}>KOPI MALAY × ROUTE 1</Text>
          <Heading style={s.heading}>Track your order</Heading>
          <Text>{name ? `Hi ${name},` : "Hi there,"}</Text>
          <Text>Someone asked to track order <strong>{orderNumber}</strong> on our website. Use the button below to see its latest status and courier tracking number. The link is private to you — please don't share it.</Text>
          {link && <Button href={link} style={s.button}>View order status</Button>}
          <Text style={s.muted}>If the button doesn't work, copy this link into your browser: {link}</Text>
          <Text style={s.muted}>Didn't ask for this? You can ignore this email — nobody else can see your order without this link.</Text>
        </Container>
      </Body>
    </Html>
  );
}

const s = {
  body: { backgroundColor: "#ffffff", color: "#252525", fontFamily: "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif" },
  container: { maxWidth: "520px", padding: "32px 24px" },
  brand: { fontSize: "12px", fontWeight: 700, color: "#555555" },
  heading: { fontSize: "26px", fontWeight: 700 },
  button: { backgroundColor: "#111111", color: "#ffffff", borderRadius: "6px", padding: "12px 20px", fontWeight: 700, textDecoration: "none" },
  muted: { color: "#555555", fontSize: "12px", lineHeight: "18px", wordBreak: "break-all" as const },
};

export const template = {
  component: OrderTrackingLink,
  subject: (d: Record<string, any>) => `Your status link for order ${d["orderNumber"] ?? ""} — Kopi Malay`,
  displayName: "Order tracking link (track page request)",
  previewData: { name: "Ahmad", orderNumber: "KM-12345", link: "https://kopimalay.com/order-success?ref=KM-12345&t=example" },
} satisfies TemplateEntry;
