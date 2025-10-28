import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function POST(request) {
  try {
    // Verify authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get form data
    const formData = await request.formData();
    const file = formData.get("file");
    const fileName = formData.get("fileName");

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Convert file to base64 for mock storage
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    const mimeType = file.type || 'image/jpeg';
    
    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedFileName = fileName?.replace(/[^a-zA-Z0-9.-]/g, "_") || "upload";
    const uniqueFileName = `${userId}_${timestamp}_${sanitizedFileName}`;

    // Create a data URL for the image (this works as a temporary solution)
    const dataUrl = `data:${mimeType};base64,${base64}`;

    console.log("Mock upload successful for:", uniqueFileName);

    // Return mock upload data that works with the frontend
    return NextResponse.json({
      success: true,
      data: {
        url: dataUrl,
        fileId: `mock_${timestamp}`,
        width: 800, // Mock dimensions
        height: 600,
        size: buffer.length,
        name: uniqueFileName,
      }
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to upload image",
        details: error.message,
      },
      { status: 500 }
    );
  }
}