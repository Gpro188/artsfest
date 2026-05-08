"use server";

import { getSettings } from "@/lib/settings";

export async function getBranding() {
  const settings = await getSettings();
  return {
    name: settings.festName,
    moto: settings.festMoto
  };
}
