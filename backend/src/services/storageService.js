const fs = require("fs/promises");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");
const env = require("../config/env");
const AppError = require("../utils/appError");

const canUseSupabase = () =>
  env.storageProvider === "supabase" &&
  env.supabaseUrl &&
  env.supabaseServiceRoleKey &&
  env.supabaseStorageBucket;

const getSupabaseClient = () =>
  createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

const buildStoragePath = ({ type, file }) => {
  const extension = path.extname(file.originalname || file.filename || "");
  const safeType = String(type || "document").toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const safeName = path
    .basename(file.originalname || file.filename || "document", extension)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);

  return `${safeType}/${Date.now()}-${safeName || "document"}${extension}`;
};

const uploadDocumentFile = async ({ file, type }) => {
  const storagePath = buildStoragePath({ type, file });

  if (canUseSupabase()) {
    const fileBuffer = await fs.readFile(file.path);
    const supabase = getSupabaseClient();
    const { error } = await supabase.storage
      .from(env.supabaseStorageBucket)
      .upload(storagePath, fileBuffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      throw error;
    }

    const { data } = supabase.storage
      .from(env.supabaseStorageBucket)
      .getPublicUrl(storagePath);

    await fs.unlink(file.path).catch(() => {});

    return {
      fileUrl: data.publicUrl,
      storageProvider: "supabase",
      storagePath,
    };
  }

  return {
    fileUrl: `${env.localStorageBaseUrl}/uploads/documents/${file.filename}`,
    storageProvider: "local",
    storagePath: `uploads/documents/${file.filename}`,
  };
};

const getDocumentAccess = async (document) => {
  if (document.storageProvider === "supabase") {
    if (!canUseSupabase()) {
      throw new AppError("Supabase storage is not configured", 500);
    }

    const supabase = getSupabaseClient();
    const { data, error } = await supabase.storage
      .from(env.supabaseStorageBucket)
      .createSignedUrl(document.storagePath, 10 * 60);

    if (error) {
      throw error;
    }

    return {
      type: "redirect",
      url: data.signedUrl,
    };
  }

  const relativePath = document.storagePath || "";
  const absolutePath = path.resolve(process.cwd(), relativePath);
  const uploadRoot = path.resolve(process.cwd(), "uploads");

  if (!absolutePath.startsWith(uploadRoot)) {
    throw new AppError("Invalid document storage path", 400);
  }

  await fs.access(absolutePath);

  return {
    type: "local-file",
    path: absolutePath,
  };
};

module.exports = {
  getDocumentAccess,
  uploadDocumentFile,
};
