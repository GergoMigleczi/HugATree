
import { PUBLIC_WEBSITE_URL } from "../../../config/config";

export function getPublicTreeUrl(treeId: number): string {
    console.log("PUBLIC_WEBSITE_URL =", PUBLIC_WEBSITE_URL);
  return `${PUBLIC_WEBSITE_URL}?id=${treeId}`;
}