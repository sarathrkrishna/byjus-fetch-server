import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Post, PostDocument } from "./post.schema";

@Injectable()
export class PostService {
  constructor(@InjectModel(Post.name) private postModel: Model<PostDocument>) {}
  addPost(postData: Post) {
    return this.postModel.create(postData);
  }
  addManyPosts(postDatas: Post[]) {
    return this.postModel.create(postDatas);
  }
  getOnePostById(postId: number) {
    return this.postModel.findOne({
      postId,
    });
  }
}
