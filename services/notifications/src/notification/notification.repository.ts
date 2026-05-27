import { Injectable } from '@nestjs/common';
import { type Notification } from '@admin-platform/database';
import { NotificationChannel, NotificationStatus } from '@admin-platform/types';
import { PrismaService } from '../common/prisma/prisma.service';

export interface CreateNotificationInput {
  readonly userId: string;
  readonly type: string;
  readonly channel: NotificationChannel;
  readonly subject?: string;
  readonly body: string;
}

/**
 * NotificationRepository — the ONLY place that calls Prisma for notification data.
 *
 * Also provides user lookups (email/phone) needed to address notifications.
 */
@Injectable()
export class NotificationRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ── User lookups ────────────────────────────────────────────────────────────

  async findUserById(userId: string): Promise<{
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string | null;
  } | null> {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, firstName: true, lastName: true, phone: true },
    });
  }

  async findFactoryOwner(factoryId: string): Promise<{
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    factoryName: string;
  } | null> {
    const factory = await this.prisma.factory.findUnique({
      where: { id: factoryId },
      select: {
        name: true,
        owner: {
          select: { id: true, email: true, firstName: true, lastName: true, phone: true },
        },
      },
    });
    if (!factory) return null;
    return {
      id:          factory.owner.id,
      email:       factory.owner.email,
      firstName:   factory.owner.firstName,
      lastName:    factory.owner.lastName,
      phone:       factory.owner.phone,
      factoryName: factory.name,
    };
  }

  async findOrderBuyer(orderId: string): Promise<{
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  } | null> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: {
        buyer: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
      },
    });
    return order?.buyer ?? null;
  }

  // ── Notification writes ─────────────────────────────────────────────────────

  async create(input: CreateNotificationInput): Promise<Notification> {
    return this.prisma.notification.create({
      data: {
        userId:  input.userId,
        type:    input.type,
        channel: input.channel,
        subject: input.subject,
        body:    input.body,
        status:  NotificationStatus.PENDING,
      },
    });
  }

  async markSent(id: string): Promise<Notification> {
    return this.prisma.notification.update({
      where: { id },
      data: { status: NotificationStatus.SENT, sentAt: new Date() },
    });
  }

  async markFailed(id: string): Promise<Notification> {
    return this.prisma.notification.update({
      where: { id },
      data: { status: NotificationStatus.FAILED },
    });
  }
}
