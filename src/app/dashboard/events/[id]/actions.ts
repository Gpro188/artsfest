"use server";

import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";

const prisma = new PrismaClient();

export async function createCategory(eventId: string, name: string, chestNumberOffset: number) {
  try {
    await prisma.category.create({
      data: { eventId, name, chestNumberOffset }
    });
    revalidatePath(`/dashboard/events/${eventId}`);
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to create category" };
  }
}

export async function updateCategory(id: string, eventId: string, name: string, chestNumberOffset: number) {
  try {
    await prisma.category.update({
      where: { id },
      data: { name, chestNumberOffset }
    });
    revalidatePath(`/dashboard/events/${eventId}`);
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to update category" };
  }
}

export async function deleteCategory(id: string, eventId: string) {
  try {
    await prisma.category.delete({ where: { id } });
    revalidatePath(`/dashboard/events/${eventId}`);
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to delete category" };
  }
}

export async function savePointMatrix(categoryId: string, eventId: string, data: any) {
  try {
    await prisma.pointMatrix.upsert({
      where: { categoryId },
      update: {
        maxIndividualPrograms: data.maxIndividualPrograms,
        individualPoints: data.individualPoints,
        groupPoints: data.groupPoints,
      },
      create: {
        categoryId,
        maxIndividualPrograms: data.maxIndividualPrograms,
        individualPoints: data.individualPoints,
        groupPoints: data.groupPoints,
      }
    });

    revalidatePath(`/dashboard/events/${eventId}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to save point matrix:", error);
    return { success: false, error: "Failed to save settings" };
  }
}

export async function saveGeneralPointMatrix(eventId: string, points: string) {
  try {
    await prisma.pointMatrix.upsert({
      where: { eventId },
      update: { generalPoints: points },
      create: { eventId, generalPoints: points }
    });
    revalidatePath(`/dashboard/events/${eventId}`);
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to save general points" };
  }
}
