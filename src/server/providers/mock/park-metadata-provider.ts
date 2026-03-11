import { db } from "@/lib/db";
import type { AttractionMetadata, ParkMetadata, ParkMetadataProvider } from "@/server/providers/contracts";

function mapAttraction(attraction: {
  id: string;
  slug: string;
  name: string;
  category: "RIDE" | "SHOW" | "DINING" | "PLAY";
  zone: string;
  description: string | null;
  thrillLevel: number;
  minHeight: number | null;
  kidFriendly: boolean;
  indoor: boolean;
  familyFriendly: boolean;
  durationMinutes: number;
  xCoord: number;
  yCoord: number;
  tags: string[];
  typicalWaitProfile: unknown;
  status: "OPEN" | "TEMPORARILY_CLOSED" | "WEATHER_DELAY";
}): AttractionMetadata {
  const waitProfile = attraction.typicalWaitProfile as Record<string, number>;

  return {
    ...attraction,
    typicalWaitProfile: Object.fromEntries(
      Object.entries(waitProfile).map(([hour, wait]) => [Number(hour), Number(wait)])
    ),
  };
}

function mapPark(park: {
  id: string;
  slug: string;
  name: string;
  resort: string;
  description: string | null;
  opensAt: string;
  closesAt: string;
  attractions: Array<Parameters<typeof mapAttraction>[0]>;
}): ParkMetadata {
  return {
    park: {
      id: park.id,
      slug: park.slug,
      name: park.name,
      resort: park.resort,
      description: park.description,
      opensAt: park.opensAt,
      closesAt: park.closesAt,
    },
    attractions: park.attractions.map(mapAttraction),
  };
}

export class PrismaParkMetadataProvider implements ParkMetadataProvider {
  async getParkBySlug(slug: string) {
    const park = await db.park.findUnique({
      where: { slug },
      include: {
        attractions: {
          orderBy: [{ category: "asc" }, { name: "asc" }],
        },
      },
    });

    return park ? mapPark(park as never) : null;
  }

  async getParkById(id: string) {
    const park = await db.park.findUnique({
      where: { id },
      include: {
        attractions: {
          orderBy: [{ category: "asc" }, { name: "asc" }],
        },
      },
    });

    return park ? mapPark(park as never) : null;
  }
}
