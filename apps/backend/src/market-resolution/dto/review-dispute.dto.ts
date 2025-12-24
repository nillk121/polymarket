import { IsString, IsNotEmpty, IsEnum } from 'class-validator';

export enum DisputeReviewDecision {
  ACCEPT = 'accepted',
  REJECT = 'rejected',
}

export class ReviewDisputeDto {
  @IsEnum(DisputeReviewDecision)
  decision: DisputeReviewDecision;

  @IsString()
  @IsNotEmpty()
  reviewNotes: string;
}

