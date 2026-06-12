"use server";

export async function getBranding() {
  // Always return generic platform branding for the central login
  return {
    name: "Artsfest Central Portal",
    moto: "Central Festival Management"
  };
}
