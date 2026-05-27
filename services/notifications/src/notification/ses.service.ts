import { Injectable } from '@nestjs/common';
import {
  SESClient,
  SendEmailCommand,
  type SendEmailCommandInput,
} from '@aws-sdk/client-ses';
import { LoggerService } from '../common/logger/logger.service';

export interface SendEmailInput {
  readonly to: string[];
  readonly subject: string;
  readonly html: string;
  readonly text: string;
}

/**
 * SesService — AWS SES email sending wrapper.
 *
 * DRY_RUN mode (SES_DRY_RUN=true) logs the email without sending.
 * Use in development to avoid requiring SES sandbox verification.
 *
 * Production requirements:
 *   - SES domain/address verified in af-south-1
 *   - SES production access (out of sandbox) — request via AWS Support
 *   - SES_FROM_ADDRESS must be a verified identity
 */
@Injectable()
export class SesService {
  private static readonly CONTEXT = 'SesService';

  private readonly client: SESClient;
  private readonly fromAddress: string;
  private readonly fromName: string;
  private readonly dryRun: boolean;

  constructor(private readonly logger: LoggerService) {
    this.client = new SESClient({
      region: process.env['AWS_REGION'] ?? 'af-south-1',
    });
    this.fromAddress = process.env['SES_FROM_ADDRESS'] ?? 'noreply@admin-platform.camluk.com';
    this.fromName    = process.env['SES_FROM_NAME']    ?? 'ADMIN Platform';
    this.dryRun      = (process.env['SES_DRY_RUN'] ?? 'true') === 'true';
  }

  async send(input: SendEmailInput): Promise<void> {
    const fromSource = `${this.fromName} <${this.fromAddress}>`;

    if (this.dryRun) {
      this.logger.log(
        `[DRY RUN] Email to ${input.to.join(', ')} — "${input.subject}"`,
        SesService.CONTEXT,
      );
      return;
    }

    const params: SendEmailCommandInput = {
      Source: fromSource,
      Destination: { ToAddresses: input.to },
      Message: {
        Subject: { Data: input.subject, Charset: 'UTF-8' },
        Body: {
          Html: { Data: input.html,  Charset: 'UTF-8' },
          Text: { Data: input.text,  Charset: 'UTF-8' },
        },
      },
    };

    try {
      const result = await this.client.send(new SendEmailCommand(params));
      this.logger.log(
        `Email sent to ${input.to.join(', ')} — MessageId: ${result.MessageId ?? 'unknown'}`,
        SesService.CONTEXT,
      );
    } catch (err) {
      this.logger.error(
        `Failed to send email to ${input.to.join(', ')}: ${err instanceof Error ? err.message : String(err)}`,
        err instanceof Error ? err.stack : undefined,
        SesService.CONTEXT,
      );
      throw err;
    }
  }
}
