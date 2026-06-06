"use server";

export async function getBranding() {
  // Since the central login page handles users from potentially multiple
  // different concurrent festivals, we return generic platform branding
  // so it's "friendly to all" and avoids confusion.
  return {
    name: "Dpro Artsfest",
    moto: "Central Festival Management Portal"
  };
}
