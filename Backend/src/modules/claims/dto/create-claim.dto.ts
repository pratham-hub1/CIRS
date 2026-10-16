import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ClaimAnswerInput {
  @IsString()
  @IsNotEmpty()
  questionText!: string;

  @IsString()
  @IsNotEmpty()
  answerText!: string;
}

export class ClaimDocumentInput {
  @IsString()
  @IsNotEmpty()
  url!: string;

  @IsString()
  @IsNotEmpty()
  docType!: string;
}

export class CreateClaimDto {
  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsDateString()
  @IsNotEmpty()
  dateLost!: string;

  @IsString()
  @IsNotEmpty()
  placeLost!: string;

  @IsString()
  @IsNotEmpty()
  identifyingMarks!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ClaimAnswerInput)
  @IsOptional()
  answers?: ClaimAnswerInput[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ClaimDocumentInput)
  @IsOptional()
  documents?: ClaimDocumentInput[];
}
