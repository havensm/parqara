import { Prisma, type TripStatus } from "@prisma/client/index";

import type {
  TripAccessRoleValue,
  TripAttendanceStatusValue,
  TripLogisticsBoardDto,
  TripLogisticsCategoryValue,
  TripLogisticsGroupDto,
  TripLogisticsTaskDto,
  TripLogisticsTaskStatusValue,
  TripPeopleStateDto,
  TripPersonDto,
} from "@/lib/contracts";
import { db } from "@/lib/db";
import { HttpError } from "@/lib/http-error";
import { sendTripLogisticsReminderEmail } from "@/lib/trip-logistics-reminder-email";
import { sendTripPersonInviteEmail } from "@/lib/trip-person-invite-email";
import { createNotifications, createTripMemberNotifications } from "@/server/services/notification-service";
import { saveUserPerson } from "@/server/services/user-service";

type DbClient = typeof db | Prisma.TransactionClient;

type TripAccessContext = {
  tripId: string;
  tripName: string;
  tripStatus: TripStatus;
  parkName: string;
  ownerUserId: string;
  isOwner: boolean;
  plannerAccessRole: TripAccessRoleValue;
  canEdit: boolean;
};

type TripPersonRecord = Prisma.TripPersonGetPayload<{
  include: {
    user: {
      select: {
        id: true;
        email: true;
        firstName: true;
        lastName: true;
        name: true;
      };
    };
  };
}>;

type TripLogisticsTaskRecord = Prisma.TripLogisticsTaskGetPayload<{
  include: {
    assignee: {
      include: {
        user: {
          select: {
            id: true;
            email: true;
            firstName: true;
            lastName: true;
            name: true;
          };
        };
      };
    };
  };
}>;

const REMINDER_COOLDOWN_MS = 1000 * 60 * 60 * 12;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function toIsoDate(value: Date | null | undefined) {
  return value ? value.toISOString().slice(0, 10) : null;
}

function toIsoTimestamp(value: Date | null | undefined) {
  return value ? value.toISOString() : null;
}

function buildUserDisplayName(user: { email: string; firstName: string | null; lastName: string | null; name: string | null }) {
  const parts = [user.firstName, user.lastName].filter((value): value is string => Boolean(value && value.trim()));
  if (parts.length) {
    return parts.join(" ");
  }

  if (user.name?.trim()) {
    return user.name.trim();
  }

  return user.email;
}

function buildTripPersonName(person: TripPersonRecord) {
  if (person.user) {
    return buildUserDisplayName(person.user);
  }

  return person.displayName?.trim() || person.email;
}

function getTripWorkspaceHrefForStatus(tripId: string, status: TripStatus) {
  return status === "DRAFT" ? `/dashboard?tripId=${tripId}` : `/trips/${tripId}`;
}

function isEditorRole(role: TripAccessRoleValue) {
  return role === "EDIT";
}

function canSendReminder(lastRemindedAt: Date | null) {
  if (!lastRemindedAt) {
    return true;
  }

  return Date.now() - lastRemindedAt.getTime() >= REMINDER_COOLDOWN_MS;
}

function serializeTripPerson(person: TripPersonRecord, ownerUserId: string): TripPersonDto {
  return {
    id: person.id,
    tripId: person.tripId,
    userId: person.userId,
    email: person.email,
    name: buildTripPersonName(person),
    attendanceStatus: person.attendanceStatus,
    plannerAccessRole: person.userId === ownerUserId ? "EDIT" : person.plannerAccessRole,
    isOwner: person.userId === ownerUserId,
    isRegistered: Boolean(person.userId),
    inviteAcceptedAt: toIsoTimestamp(person.inviteAcceptedAt),
    lastInvitedAt: toIsoTimestamp(person.lastInvitedAt),
    lastRemindedAt: toIsoTimestamp(person.lastRemindedAt),
    createdAt: person.createdAt.toISOString(),
  };
}

function serializeTripLogisticsTask(task: TripLogisticsTaskRecord, ownerUserId: string): TripLogisticsTaskDto {
  return {
    id: task.id,
    tripId: task.tripId,
    assigneePersonId: task.assigneePersonId,
    title: task.title,
    category: task.category,
    status: task.status,
    source: task.source,
    dueDate: toIsoDate(task.dueDate),
    note: task.note,
    reminderNote: task.reminderNote,
    lastRemindedAt: toIsoTimestamp(task.lastRemindedAt),
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
    assignee: serializeTripPerson(task.assignee, ownerUserId),
  };
}

function sortPeople(people: TripPersonDto[]) {
  return [...people].sort((left, right) => {
    if (left.isOwner !== right.isOwner) {
      return left.isOwner ? -1 : 1;
    }

    if (left.isRegistered !== right.isRegistered) {
      return left.isRegistered ? -1 : 1;
    }

    return left.name.localeCompare(right.name);
  });
}

async function syncCollaboratorAccess(
  tx: Prisma.TransactionClient,
  tripId: string,
  ownerUserId: string,
  person: { userId: string | null; plannerAccessRole: TripAccessRoleValue }
) {
  if (!person.userId || person.userId === ownerUserId) {
    return;
  }

  if (person.plannerAccessRole === "NONE") {
    await tx.tripCollaborator.deleteMany({
      where: {
        tripId,
        userId: person.userId,
      },
    });
    return;
  }

  await tx.tripCollaborator.upsert({
    where: {
      tripId_userId: {
        tripId,
        userId: person.userId,
      },
    },
    update: {
      accessRole: person.plannerAccessRole,
    },
    create: {
      tripId,
      userId: person.userId,
      accessRole: person.plannerAccessRole,
    },
  });
}

function assertCanManageTrip(context: TripAccessContext) {
  if (!context.canEdit) {
    throw new HttpError(403, "You do not have edit access to this planner.");
  }
}

async function getTripSeedState(tripId: string, dbClient: DbClient) {
  return dbClient.trip.findUnique({
    where: { id: tripId },
    select: {
      id: true,
      userId: true,
      status: true,
      name: true,
      park: {
        select: {
          name: true,
        },
      },
      user: {
        select: {
          email: true,
          firstName: true,
          lastName: true,
          name: true,
        },
      },
      collaborators: {
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              name: true,
            },
          },
        },
      },
      pendingInvites: {
        select: {
          email: true,
          invitedByUserId: true,
          createdAt: true,
        },
      },
      people: {
        select: {
          email: true,
        },
      },
    },
  });
}

export async function ensureTripPeopleSeeded(tripId: string, dbClient: DbClient = db) {
  const trip = await getTripSeedState(tripId, dbClient);
  if (!trip) {
    throw new HttpError(404, "Trip not found.");
  }

  const existingEmails = new Set(trip.people.map((person) => normalizeEmail(person.email)));
  const now = new Date();
  const createRows: Prisma.TripPersonCreateManyInput[] = [];

  const ownerEmail = normalizeEmail(trip.user.email);
  if (!existingEmails.has(ownerEmail)) {
    existingEmails.add(ownerEmail);
    createRows.push({
      tripId: trip.id,
      userId: trip.userId,
      invitedByUserId: trip.userId,
      email: ownerEmail,
      displayName: buildUserDisplayName(trip.user),
      attendanceStatus: "ATTENDING",
      plannerAccessRole: "EDIT",
      inviteAcceptedAt: now,
      lastInvitedAt: now,
    });
  }

  for (const collaborator of trip.collaborators) {
    const email = normalizeEmail(collaborator.user.email);
    if (existingEmails.has(email)) {
      continue;
    }

    existingEmails.add(email);
    createRows.push({
      tripId: trip.id,
      userId: collaborator.userId,
      invitedByUserId: trip.userId,
      email,
      displayName: buildUserDisplayName(collaborator.user),
      attendanceStatus: "ATTENDING",
      plannerAccessRole: collaborator.accessRole,
      inviteAcceptedAt: now,
      lastInvitedAt: now,
    });
  }

  for (const invite of trip.pendingInvites) {
    const email = normalizeEmail(invite.email);
    if (existingEmails.has(email)) {
      continue;
    }

    existingEmails.add(email);
    createRows.push({
      tripId: trip.id,
      userId: null,
      invitedByUserId: invite.invitedByUserId,
      email,
      displayName: invite.email,
      attendanceStatus: "INVITED",
      plannerAccessRole: "EDIT",
      lastInvitedAt: invite.createdAt,
    });
  }

  if (createRows.length) {
    await dbClient.tripPerson.createMany({
      data: createRows,
      skipDuplicates: true,
    });
  }
}

export async function getTripAccessContext(userId: string, tripId: string): Promise<TripAccessContext> {
  const trip = await db.trip.findFirst({
    where: {
      id: tripId,
      OR: [{ userId }, { collaborators: { some: { userId } } }, { people: { some: { userId } } }],
    },
    select: {
      id: true,
      name: true,
      status: true,
      plannerStatus: true,
      userId: true,
      park: {
        select: {
          name: true,
        },
      },
      collaborators: {
        where: { userId },
        select: {
          accessRole: true,
        },
        take: 1,
      },
    },
  });

  if (!trip) {
    throw new HttpError(404, "Trip not found.");
  }

  const isOwner = trip.userId === userId;
  const plannerAccessRole: TripAccessRoleValue = isOwner ? "EDIT" : trip.collaborators[0]?.accessRole ?? "NONE";

  return {
    tripId: trip.id,
    tripName: trip.name,
    tripStatus: trip.status,
    parkName: trip.park.name,
    ownerUserId: trip.userId,
    isOwner,
    plannerAccessRole,
    canEdit: isOwner || isEditorRole(plannerAccessRole),
  };
}

async function getTripPeopleRecords(tripId: string) {
  await ensureTripPeopleSeeded(tripId);

  return db.tripPerson.findMany({
    where: { tripId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          name: true,
        },
      },
    },
    orderBy: [{ createdAt: "asc" }],
  });
}

export async function getTripPeopleState(userId: string, tripId: string): Promise<TripPeopleStateDto> {
  const access = await getTripAccessContext(userId, tripId);
  const people = sortPeople((await getTripPeopleRecords(tripId)).map((person) => serializeTripPerson(person, access.ownerUserId)));
  const owner = people.find((person) => person.isOwner);

  if (!owner) {
    throw new Error("Trip owner roster row is missing.");
  }

  return {
    tripId,
    canManage: access.canEdit,
    isOwner: access.isOwner,
    owner,
    people: people.filter((person) => !person.isOwner),
  };
}

async function getExistingUserByEmail(email: string) {
  return db.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      name: true,
    },
  });
}

export async function addTripPerson(
  userId: string,
  tripId: string,
  input: { email: string; name?: string; plannerAccessRole: TripAccessRoleValue; attendanceStatus: TripAttendanceStatusValue },
  appOrigin: string
): Promise<TripPeopleStateDto> {
  const access = await getTripAccessContext(userId, tripId);
  assertCanManageTrip(access);
  await ensureTripPeopleSeeded(tripId);

  const normalizedEmail = normalizeEmail(input.email);
  const existing = await db.tripPerson.findUnique({
    where: {
      tripId_email: {
        tripId,
        email: normalizedEmail,
      },
    },
  });

  if (existing) {
    throw new HttpError(400, "That person is already on this trip.");
  }

  const existingUser = await getExistingUserByEmail(normalizedEmail);
  if (existingUser?.id === access.ownerUserId) {
    throw new HttpError(400, "The trip owner is already on this trip.");
  }

  const now = new Date();
  const person = await db.$transaction(async (tx) => {
    const created = await tx.tripPerson.create({
      data: {
        tripId,
        userId: existingUser?.id ?? null,
        invitedByUserId: userId,
        email: normalizedEmail,
        displayName: input.name?.trim() || (existingUser ? buildUserDisplayName(existingUser) : normalizedEmail),
        attendanceStatus: input.attendanceStatus,
        plannerAccessRole: input.plannerAccessRole,
        inviteAcceptedAt: existingUser ? now : null,
        lastInvitedAt: existingUser ? null : now,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            name: true,
          },
        },
      },
    });

    await syncCollaboratorAccess(tx, tripId, access.ownerUserId, {
      userId: created.userId,
      plannerAccessRole: created.plannerAccessRole,
    });

    return created;
  });

  if (person.userId) {
    await saveUserPerson(userId, person.userId).catch(() => null);

    if (person.plannerAccessRole !== "NONE") {
      await createNotifications({
        userIds: [person.userId],
        actorUserId: userId,
        tripId,
        type: "COLLABORATION",
        severity: "info",
        title: `You were added to ${access.tripName}`,
        detail:
          person.plannerAccessRole === "VIEW"
            ? "You can now open this planner, follow the shared trip, and work through your assigned logistics."
            : "You can now open this planner and help keep the shared trip moving.",
        actionHref: getTripWorkspaceHrefForStatus(tripId, access.tripStatus),
      });
    }
  } else {
    await sendTripPersonInviteEmail({
      to: normalizedEmail,
      inviterName: "A Parqara organizer",
      tripName: access.tripName,
      parkName: access.parkName,
      actionUrl: `${appOrigin}/signup?email=${encodeURIComponent(normalizedEmail)}`,
      plannerAccessRole: input.plannerAccessRole,
    });
  }

  await createTripMemberNotifications({
    tripId,
    actorUserId: userId,
    excludeUserIds: [userId, ...(person.userId ? [person.userId] : [])],
    type: "COLLABORATION",
    severity: "info",
    title: "Trip roster updated",
    detail: `${buildTripPersonName(person)} was added to this trip.`,
    actionHref: getTripWorkspaceHrefForStatus(tripId, access.tripStatus),
  });

  return getTripPeopleState(userId, tripId);
}

export async function updateTripPerson(
  userId: string,
  tripId: string,
  personId: string,
  input: { name?: string; plannerAccessRole?: TripAccessRoleValue; attendanceStatus?: TripAttendanceStatusValue }
): Promise<TripPeopleStateDto> {
  const access = await getTripAccessContext(userId, tripId);
  assertCanManageTrip(access);
  await ensureTripPeopleSeeded(tripId);

  const person = await db.tripPerson.findFirst({
    where: { id: personId, tripId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          name: true,
        },
      },
    },
  });

  if (!person) {
    throw new HttpError(404, "Trip person not found.");
  }

  if (person.userId === access.ownerUserId) {
    throw new HttpError(400, "The trip owner cannot be changed here.");
  }

  const updated = await db.$transaction(async (tx) => {
    const next = await tx.tripPerson.update({
      where: { id: person.id },
      data: {
        displayName: input.name === undefined ? person.displayName : input.name.trim() || null,
        plannerAccessRole: input.plannerAccessRole ?? person.plannerAccessRole,
        attendanceStatus: input.attendanceStatus ?? person.attendanceStatus,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            name: true,
          },
        },
      },
    });

    await syncCollaboratorAccess(tx, tripId, access.ownerUserId, {
      userId: next.userId,
      plannerAccessRole: next.plannerAccessRole,
    });

    return next;
  });

  if (updated.userId) {
    await createNotifications({
      userIds: [updated.userId],
      actorUserId: userId,
      tripId,
      type: "COLLABORATION",
      severity: "info",
      title: `${access.tripName} was updated`,
      detail: "Your trip attendance or planner access changed.",
      actionHref: updated.plannerAccessRole === "NONE" ? "/dashboard" : getTripWorkspaceHrefForStatus(tripId, access.tripStatus),
    });
  }

  return getTripPeopleState(userId, tripId);
}

export async function removeTripPerson(userId: string, tripId: string, personId: string): Promise<TripPeopleStateDto> {
  const access = await getTripAccessContext(userId, tripId);
  assertCanManageTrip(access);
  await ensureTripPeopleSeeded(tripId);

  const person = await db.tripPerson.findFirst({
    where: { id: personId, tripId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          name: true,
        },
      },
    },
  });

  if (!person) {
    throw new HttpError(404, "Trip person not found.");
  }

  if (person.userId === access.ownerUserId) {
    throw new HttpError(400, "The trip owner cannot be removed.");
  }

  await db.$transaction(async (tx) => {
    await syncCollaboratorAccess(tx, tripId, access.ownerUserId, {
      userId: person.userId,
      plannerAccessRole: "NONE",
    });

    await tx.tripPerson.delete({
      where: { id: person.id },
    });
  });

  if (person.userId) {
    await createNotifications({
      userIds: [person.userId],
      actorUserId: userId,
      tripId,
      type: "COLLABORATION",
      severity: "warning",
      title: `You were removed from ${access.tripName}`,
      detail: "That trip is no longer assigned to you.",
      actionHref: "/dashboard",
    });
  }

  return getTripPeopleState(userId, tripId);
}

export async function resendTripPersonInvite(userId: string, tripId: string, personId: string, appOrigin: string): Promise<TripPeopleStateDto> {
  const access = await getTripAccessContext(userId, tripId);
  assertCanManageTrip(access);
  await ensureTripPeopleSeeded(tripId);

  const person = await db.tripPerson.findFirst({
    where: { id: personId, tripId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          name: true,
        },
      },
    },
  });

  if (!person) {
    throw new HttpError(404, "Trip person not found.");
  }

  if (person.userId) {
    throw new HttpError(400, "That attendee already has an account.");
  }

  await sendTripPersonInviteEmail({
    to: person.email,
    inviterName: "A Parqara organizer",
    tripName: access.tripName,
    parkName: access.parkName,
    actionUrl: `${appOrigin}/signup?email=${encodeURIComponent(person.email)}`,
    plannerAccessRole: person.plannerAccessRole,
  });

  await db.tripPerson.update({
    where: { id: person.id },
    data: { lastInvitedAt: new Date() },
  });

  return getTripPeopleState(userId, tripId);
}

export async function claimPendingTripPeopleForUser(userId: string, email: string) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    return;
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      firstName: true,
      lastName: true,
      name: true,
    },
  });

  if (!user) {
    return;
  }

  const pendingPeople = await db.tripPerson.findMany({
    where: {
      email: normalizedEmail,
      userId: null,
    },
    include: {
      trip: {
        select: {
          id: true,
          name: true,
          status: true,
          userId: true,
        },
      },
    },
  });

  for (const person of pendingPeople) {
    await db.$transaction(async (tx) => {
      const updated = await tx.tripPerson.update({
        where: { id: person.id },
        data: {
          userId,
          displayName: buildUserDisplayName(user),
          inviteAcceptedAt: new Date(),
        },
      });

      await syncCollaboratorAccess(tx, person.tripId, person.trip.userId, {
        userId,
        plannerAccessRole: updated.plannerAccessRole,
      });
    });

    await saveUserPerson(person.invitedByUserId, userId).catch(() => null);

    if (person.plannerAccessRole !== "NONE") {
      await createNotifications({
        userIds: [userId],
        actorUserId: person.invitedByUserId,
        tripId: person.tripId,
        type: "COLLABORATION",
        severity: "info",
        title: `Your access to ${person.trip.name} is ready`,
        detail: "Open the planner to see the shared trip and your assigned work.",
        actionHref: getTripWorkspaceHrefForStatus(person.trip.id, person.trip.status),
      });
    }

    await createTripMemberNotifications({
      tripId: person.tripId,
      actorUserId: person.invitedByUserId,
      excludeUserIds: [person.invitedByUserId, userId],
      type: "COLLABORATION",
      severity: "info",
      title: "Trip attendee joined",
      detail: `${normalizedEmail} joined this trip on Parqara.`,
      actionHref: getTripWorkspaceHrefForStatus(person.trip.id, person.trip.status),
    });
  }
}

async function getTripLogisticsRecords(tripId: string) {
  await ensureTripPeopleSeeded(tripId);

  const [trip, tasks] = await Promise.all([
    db.trip.findUnique({
      where: { id: tripId },
      select: {
        id: true,
        userId: true,
        people: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                name: true,
              },
            },
          },
          orderBy: [{ createdAt: "asc" }],
        },
      },
    }),
    db.tripLogisticsTask.findMany({
      where: { tripId },
      include: {
        assignee: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }],
    }),
  ]);

  if (!trip) {
    throw new HttpError(404, "Trip not found.");
  }

  return { trip, tasks };
}

function buildGroupedBoard(
  peopleRecords: TripPersonRecord[],
  taskRecords: TripLogisticsTaskRecord[],
  ownerUserId: string,
  canManage: boolean,
  viewerUserId: string
): TripLogisticsBoardDto {
  const serializedPeople = sortPeople(peopleRecords.map((person) => serializeTripPerson(person, ownerUserId)));
  const visiblePeople = canManage ? serializedPeople : serializedPeople.filter((person) => person.userId === viewerUserId);
  const visiblePersonIds = new Set(visiblePeople.map((person) => person.id));
  const visibleTasks = taskRecords.filter((task) => visiblePersonIds.has(task.assigneePersonId));

  const groups: TripLogisticsGroupDto[] = visiblePeople.map((person) => {
    const tasks = visibleTasks
      .filter((task) => task.assigneePersonId === person.id)
      .map((task) => serializeTripLogisticsTask(task, ownerUserId));
    const done = tasks.filter((task) => task.status === "DONE").length;

    return {
      person,
      completion: {
        done,
        total: tasks.length,
      },
      tasks,
    };
  });

  return {
    tripId: taskRecords[0]?.tripId ?? peopleRecords[0]?.tripId ?? "",
    canManage,
    groups,
  };
}

export async function getTripLogisticsBoard(userId: string, tripId: string): Promise<TripLogisticsBoardDto> {
  const access = await getTripAccessContext(userId, tripId);
  const { trip, tasks } = await getTripLogisticsRecords(tripId);
  return buildGroupedBoard(trip.people, tasks, trip.userId, access.canEdit, userId);
}

function shouldSuggestFlightLogistics(tripName: string, parkName: string) {
  return /alaska|vacation|airport|flight|fly|cruise|trip to|resort/i.test(`${tripName} ${parkName}`);
}

function shouldSuggestGear(tripName: string, parkName: string) {
  return /fishing|ski|camp|hike|alaska|outdoor|gear/i.test(`${tripName} ${parkName}`);
}

function shouldSuggestPto(tripName: string) {
  return /week|vacation|getaway|trip|alaska/i.test(tripName);
}

function buildMaraSuggestedTasks(input: {
  tripName: string;
  parkName: string;
  people: TripPersonRecord[];
  existingTasks: TripLogisticsTaskRecord[];
  ownerUserId: string;
}) {
  const activePeople = input.people.filter((person) => person.attendanceStatus !== "NOT_ATTENDING");
  const existingKeys = new Set(input.existingTasks.map((task) => `${task.assigneePersonId}:${task.title.toLowerCase()}`));
  const suggestions: Array<{
    assigneePersonId: string;
    title: string;
    category: TripLogisticsCategoryValue;
    note?: string;
  }> = [];

  for (const person of activePeople) {
    const add = (title: string, category: TripLogisticsCategoryValue, note?: string) => {
      const key = `${person.id}:${title.toLowerCase()}`;
      if (existingKeys.has(key)) {
        return;
      }

      existingKeys.add(key);
      suggestions.push({ assigneePersonId: person.id, title, category, note });
    };

    add("Confirm Real ID or passport", "DOCS", "Make sure travel ID is ready before booking deadlines tighten.");

    if (shouldSuggestFlightLogistics(input.tripName, input.parkName)) {
      add("Book flights", "TRANSPORT", "Lock flights early if the group is traveling from different cities.");
    }

    if (shouldSuggestPto(input.tripName)) {
      add("Put in PTO", "TIME_OFF", "Handle time-off early so shared bookings are easier to confirm.");
    }

    if (shouldSuggestGear(input.tripName, input.parkName)) {
      add("Check fishing gear and cold-weather layers", "GEAR", "Use this to cover personal gear before the trip is locked.");
    }
  }

  const owner = activePeople.find((person) => person.userId === input.ownerUserId);
  if (owner) {
    const ownerKey = `${owner.id}:confirm lodging details`;
    if (!existingKeys.has(ownerKey)) {
      suggestions.push({
        assigneePersonId: owner.id,
        title: "Confirm lodging details",
        category: "LODGING",
        note: "Keep the shared stay details pinned so everyone is working from the same plan.",
      });
    }
  }

  return suggestions;
}

export async function createTripLogisticsItems(
  userId: string,
  tripId: string,
  input:
    | { mode: "manual"; assigneePersonId: string; title: string; category: TripLogisticsCategoryValue; dueDate?: string; note?: string }
    | { mode: "suggestions" }
): Promise<TripLogisticsBoardDto> {
  const access = await getTripAccessContext(userId, tripId);
  assertCanManageTrip(access);
  const { trip, tasks } = await getTripLogisticsRecords(tripId);

  if (input.mode === "manual") {
    const assignee = trip.people.find((person) => person.id === input.assigneePersonId);
    if (!assignee) {
      throw new HttpError(404, "Assignee not found.");
    }

    await db.tripLogisticsTask.create({
      data: {
        tripId,
        assigneePersonId: assignee.id,
        createdByUserId: userId,
        title: input.title.trim(),
        category: input.category,
        source: "MANUAL",
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
        note: input.note?.trim() || null,
      },
    });
  } else {
    const suggestions = buildMaraSuggestedTasks({
      tripName: access.tripName,
      parkName: access.parkName,
      people: trip.people,
      existingTasks: tasks,
      ownerUserId: trip.userId,
    });

    if (suggestions.length) {
      await db.tripLogisticsTask.createMany({
        data: suggestions.map((task) => ({
          tripId,
          assigneePersonId: task.assigneePersonId,
          createdByUserId: userId,
          title: task.title,
          category: task.category,
          source: "MARA",
          note: task.note ?? null,
        })),
      });
    }
  }

  return getTripLogisticsBoard(userId, tripId);
}

export async function updateTripLogisticsTask(
  userId: string,
  tripId: string,
  taskId: string,
  input: {
    assigneePersonId?: string;
    title?: string;
    category?: TripLogisticsCategoryValue;
    status?: TripLogisticsTaskStatusValue;
    dueDate?: string;
    note?: string | null;
    reminderNote?: string | null;
  }
): Promise<TripLogisticsBoardDto> {
  const access = await getTripAccessContext(userId, tripId);
  await ensureTripPeopleSeeded(tripId);

  const task = await db.tripLogisticsTask.findFirst({
    where: { id: taskId, tripId },
    include: {
      assignee: {
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              name: true,
            },
          },
        },
      },
    },
  });

  if (!task) {
    throw new HttpError(404, "Task not found.");
  }

  const isSelfTask = task.assignee.userId === userId;
  if (!access.canEdit && !isSelfTask) {
    throw new HttpError(403, "You can only update your own tasks.");
  }

  if (!access.canEdit) {
    await db.tripLogisticsTask.update({
      where: { id: task.id },
      data: {
        status: input.status ?? task.status,
      },
    });

    return getTripLogisticsBoard(userId, tripId);
  }

  await db.tripLogisticsTask.update({
    where: { id: task.id },
    data: {
      assigneePersonId: input.assigneePersonId ?? task.assigneePersonId,
      title: input.title?.trim() || task.title,
      category: input.category ?? task.category,
      status: input.status ?? task.status,
      dueDate: input.dueDate === undefined ? task.dueDate : input.dueDate ? new Date(input.dueDate) : null,
      note: input.note === undefined ? task.note : input.note,
      reminderNote: input.reminderNote === undefined ? task.reminderNote : input.reminderNote,
    },
  });

  return getTripLogisticsBoard(userId, tripId);
}

export async function deleteTripLogisticsTask(userId: string, tripId: string, taskId: string): Promise<TripLogisticsBoardDto> {
  const access = await getTripAccessContext(userId, tripId);
  assertCanManageTrip(access);

  const task = await db.tripLogisticsTask.findFirst({
    where: { id: taskId, tripId },
    select: { id: true },
  });

  if (!task) {
    throw new HttpError(404, "Task not found.");
  }

  await db.tripLogisticsTask.delete({
    where: { id: task.id },
  });

  return getTripLogisticsBoard(userId, tripId);
}

async function notifyAndEmailReminder(
  actorUserId: string,
  tripId: string,
  tripName: string,
  tripStatus: TripStatus,
  person: TripPersonRecord,
  tasks: string[],
  note: string | undefined,
  appOrigin: string
) {
  if (person.userId) {
    await createNotifications({
      userIds: [person.userId],
      actorUserId,
      tripId,
      type: "PLANNER",
      severity: "info",
      title: `${tripName} needs your attention`,
      detail: tasks.length ? `Still open: ${tasks.slice(0, 2).join(", ")}${tasks.length > 2 ? "..." : ""}` : "You have open trip logistics waiting.",
      actionHref: person.plannerAccessRole === "NONE" ? "/dashboard" : getTripWorkspaceHrefForStatus(tripId, tripStatus),
    });
  }

  await sendTripLogisticsReminderEmail({
    to: person.email,
    inviterName: "A Parqara organizer",
    tripName,
    actionUrl: `${appOrigin}${person.plannerAccessRole === "NONE" ? "/signup" : getTripWorkspaceHrefForStatus(tripId, tripStatus)}`,
    tasks,
    reminderNote: note,
  });
}

export async function sendTripPersonReminder(
  userId: string,
  tripId: string,
  personId: string,
  input: { note?: string },
  appOrigin: string
): Promise<TripLogisticsBoardDto> {
  const access = await getTripAccessContext(userId, tripId);
  assertCanManageTrip(access);
  await ensureTripPeopleSeeded(tripId);

  const person = await db.tripPerson.findFirst({
    where: { id: personId, tripId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          name: true,
        },
      },
      tasks: {
        where: {
          status: { in: ["TODO", "IN_PROGRESS", "BLOCKED"] },
        },
      },
    },
  });

  if (!person) {
    throw new HttpError(404, "Trip person not found.");
  }

  if (!canSendReminder(person.lastRemindedAt)) {
    throw new HttpError(429, "A reminder was sent recently. Try again later.");
  }

  const openTasks = person.tasks.map((task) => task.title);
  await notifyAndEmailReminder(userId, tripId, access.tripName, access.tripStatus, person, openTasks, input.note, appOrigin);

  await db.tripPerson.update({
    where: { id: person.id },
    data: {
      lastRemindedAt: new Date(),
    },
  });

  return getTripLogisticsBoard(userId, tripId);
}

export async function sendTripLogisticsTaskReminder(
  userId: string,
  tripId: string,
  taskId: string,
  input: { note?: string },
  appOrigin: string
): Promise<TripLogisticsBoardDto> {
  const access = await getTripAccessContext(userId, tripId);
  assertCanManageTrip(access);
  await ensureTripPeopleSeeded(tripId);

  const task = await db.tripLogisticsTask.findFirst({
    where: { id: taskId, tripId },
    include: {
      assignee: {
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              name: true,
            },
          },
        },
      },
    },
  });

  if (!task) {
    throw new HttpError(404, "Task not found.");
  }

  if (!canSendReminder(task.lastRemindedAt)) {
    throw new HttpError(429, "A reminder was sent recently. Try again later.");
  }

  await notifyAndEmailReminder(userId, tripId, access.tripName, access.tripStatus, task.assignee, [task.title], input.note, appOrigin);

  await db.tripLogisticsTask.update({
    where: { id: task.id },
    data: {
      lastRemindedAt: new Date(),
      reminderNote: input.note?.trim() || task.reminderNote,
    },
  });

  return getTripLogisticsBoard(userId, tripId);
}

export async function getTripLogisticsContextForMara(userId: string, tripId: string) {
  const access = await getTripAccessContext(userId, tripId);
  const { trip, tasks } = await getTripLogisticsRecords(tripId);
  const board = buildGroupedBoard(trip.people, tasks, trip.userId, access.canEdit, userId);

  return {
    plannerAccessRole: access.plannerAccessRole,
    canEdit: access.canEdit,
    scopedToViewer: !access.canEdit,
    rosterSummary: board.groups.map((group) => {
      const accessLabel = group.person.isOwner
        ? "Owner"
        : group.person.plannerAccessRole === "NONE"
          ? "No planner access"
          : `${group.person.plannerAccessRole.toLowerCase()} access`;
      return `${group.person.name} (${group.person.attendanceStatus.toLowerCase()}, ${accessLabel})`;
    }),
    logisticsSummary: board.groups.flatMap((group) =>
      group.tasks.map((task) => `${group.person.name}: ${task.title} [${task.status}]`)
    ),
    viewerTasks: board.groups.flatMap((group) => group.tasks.map((task) => task.title)),
  };
}
