import "server-only";

import { headers } from "next/headers";

type ApproximateRequestLocation = {
  label: string;
  source: "header" | "ip";
};

function normalizeLocationPart(value: string | null) {
  if (!value) {
    return null;
  }

  try {
    const decoded = decodeURIComponent(value);
    return decoded.replace(/\+/g, " ").trim() || null;
  } catch {
    return value.replace(/\+/g, " ").trim() || null;
  }
}

function buildLocationLabel(parts: Array<string | null>) {
  const uniqueParts = parts.filter((part, index, values): part is string => Boolean(part) && values.indexOf(part) === index);
  return uniqueParts.length ? uniqueParts.join(", ") : null;
}

function isPrivateIp(value: string) {
  const ip = value.trim().toLowerCase();

  if (!ip || ip === "::1" || ip === "localhost") {
    return true;
  }

  if (/^127\./.test(ip) || /^10\./.test(ip) || /^192\.168\./.test(ip)) {
    return true;
  }

  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(ip)) {
    return true;
  }

  if (/^(fc|fd|fe80):/i.test(ip)) {
    return true;
  }

  return false;
}

function getClientIp(headerList: Headers) {
  const forwardedFor = headerList.get("x-forwarded-for");
  if (forwardedFor) {
    const forwardedIp = forwardedFor
      .split(",")
      .map((part) => part.trim())
      .find(Boolean);

    if (forwardedIp && !isPrivateIp(forwardedIp)) {
      return forwardedIp;
    }
  }

  const candidateHeaders = ["x-real-ip", "cf-connecting-ip", "fly-client-ip", "x-client-ip"];
  for (const headerName of candidateHeaders) {
    const candidate = headerList.get(headerName)?.trim();
    if (candidate && !isPrivateIp(candidate)) {
      return candidate;
    }
  }

  return null;
}

function getHeaderLocation(headerList: Headers) {
  const city =
    normalizeLocationPart(headerList.get("x-vercel-ip-city")) ??
    normalizeLocationPart(headerList.get("cloudfront-viewer-city")) ??
    normalizeLocationPart(headerList.get("x-geo-city"));
  const region =
    normalizeLocationPart(headerList.get("x-vercel-ip-country-region")) ??
    normalizeLocationPart(headerList.get("cloudfront-viewer-country-region")) ??
    normalizeLocationPart(headerList.get("x-geo-region"));
  const country =
    normalizeLocationPart(headerList.get("x-vercel-ip-country")) ??
    normalizeLocationPart(headerList.get("cloudfront-viewer-country-name")) ??
    normalizeLocationPart(headerList.get("x-geo-country"));

  const label = buildLocationLabel([city, region, country]);
  if (!label) {
    return null;
  }

  return {
    label,
    source: "header" as const,
  };
}

async function getIpLookupLocation(ip: string): Promise<ApproximateRequestLocation | null> {
  try {
    const response = await fetch(`https://ipwho.is/${encodeURIComponent(ip)}?fields=success,city,region,country`, {
      headers: {
        Accept: "application/json",
      },
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      return null;
    }

    const result = (await response.json()) as {
      success?: boolean;
      city?: string | null;
      region?: string | null;
      country?: string | null;
    };

    if (!result.success) {
      return null;
    }

    const label = buildLocationLabel([
      normalizeLocationPart(result.city ?? null),
      normalizeLocationPart(result.region ?? null),
      normalizeLocationPart(result.country ?? null),
    ]);

    if (!label) {
      return null;
    }

    return {
      label,
      source: "ip",
    };
  } catch {
    return null;
  }
}

export async function getApproximateRequestLocation(): Promise<ApproximateRequestLocation | null> {
  const headerList = await headers();
  const headerLocation = getHeaderLocation(headerList);
  if (headerLocation) {
    return headerLocation;
  }

  const clientIp = getClientIp(headerList);
  if (!clientIp) {
    return null;
  }

  return getIpLookupLocation(clientIp);
}
