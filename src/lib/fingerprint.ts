// Anonymous browser fingerprint stored in localStorage
const KEY = "blog_fp_v1";

export function getFingerprint(): string {
  if (typeof window === "undefined") return "ssr";
  let fp = localStorage.getItem(KEY);
  if (!fp) {
    fp = crypto.randomUUID() + "-" + Date.now().toString(36);
    localStorage.setItem(KEY, fp);
  }
  return fp;
}
