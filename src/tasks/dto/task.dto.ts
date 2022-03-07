import { ObjectId } from "src/shared/dtos/mongo.dto";

export class DoubtCheckDto {
  postId?: number;
  status: "available" | "already_fetched" | "too_much_requests";
  accountId: ObjectId;
  token: string;
}

export class PostDto {
  id: number;
  description: string;
  subject_name: string;
  grade: string;
  total_points: number;
  created_at: number;
  updated_at: number;
  subject_expert_name: string;
  can_answer_till: number;
}

export class QuestionFetchedDto {
  postData: PostDto[];
  accountId: ObjectId;
}
