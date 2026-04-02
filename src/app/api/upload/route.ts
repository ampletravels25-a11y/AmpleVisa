import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { saveFile, validateFile } from "@/lib/upload";
import { ACCEPTED_FILE_TYPES, MAX_FILE_SIZE_MB } from "@/lib/constants";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    const validationError = validateFile(file, ACCEPTED_FILE_TYPES, MAX_FILE_SIZE_MB);
    if (validationError) {
      return NextResponse.json(
        { success: false, error: validationError },
        { status: 400 }
      );
    }

    const subfolder = (formData.get("subfolder") as string) || "documents";
    const result = await saveFile(file, subfolder);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { success: false, error: "Upload failed" },
      { status: 500 }
    );
  }
}
