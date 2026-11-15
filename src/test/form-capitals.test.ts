import { describe, expect, it } from "vitest";
import { capitalizeFormDetails, capitalizeFormValue } from "@/lib/form-capitals";
import { townsForRegion } from "@/lib/thai-regions";

describe("customer form capitals", () => {
  it("capitalizes names, addresses and motorcycle details in submitted values", () => {
    expect(capitalizeFormDetails({ name: "Ahmad bin Ali", address: "Jalan Ampang", city: "Tak", motorcycle_model: "Honda CB500X", breakdown_location: "Near PTT", nationality: "Malaysia", passport_number: "a12345" })).toEqual({ name: "AHMAD BIN ALI", address: "JALAN AMPANG", city: "TAK", motorcycle_model: "HONDA CB500X", breakdown_location: "NEAR PTT", nationality: "MALAYSIA", passport_number: "A12345" });
  });
  it("preserves email case", () => {
    expect(capitalizeFormValue("email", "Rider.Example@example.com")).toBe("Rider.Example@example.com");
  });
  it("preserves case-sensitive passwords", () => {
    expect(capitalizeFormValue("password", "MiXeD-Pass123")).toBe("MiXeD-Pass123");
  });
  it("preserves Maps short links", () => {
    expect(capitalizeFormValue("maps_link", "https://maps.app.goo.gl/7xYzQ9")).toBe("https://maps.app.goo.gl/7xYzQ9");
  });
  it("preserves contact handles and canonical dropdown values", () => {
    expect(capitalizeFormDetails({ contact_handle: "Rider@example.com", state: "Sabah", country: "malaysia", preferred_contact: "whatsapp" })).toEqual({ contact_handle: "Rider@example.com", state: "Sabah", country: "malaysia", preferred_contact: "whatsapp" });
  });
  it("keeps Tak available under Northern", () => {
    expect(townsForRegion("Northern")).toContain("Tak");
  });
  it("supports the previous region name for existing requests", () => {
    expect(townsForRegion("Northern & Touring")).toEqual(townsForRegion("Northern"));
  });
});