export interface SocialMediaPost {
  content: string
  imageUrl?: string
  scheduledFor?: Date
}

export interface PostResult {
  success: boolean
  platformPostId?: string
  error?: string
}

export class SocialMediaService {
  // Instagram API integration
  static async postToInstagram(accessToken: string, userId: string, post: SocialMediaPost): Promise<PostResult> {
    try {
      // Instagram Basic Display API / Instagram Graph API
      const instagramApiUrl = `https://graph.instagram.com/v18.0/${userId}/media`

      let mediaId: string

      if (post.imageUrl) {
        // Create media object with image
        const mediaResponse = await fetch(instagramApiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            image_url: post.imageUrl,
            caption: post.content,
            access_token: accessToken,
          }),
        })

        if (!mediaResponse.ok) {
          const error = await mediaResponse.json()
          throw new Error(error.error?.message || "Failed to create Instagram media")
        }

        const mediaData = await mediaResponse.json()
        mediaId = mediaData.id
      } else {
        throw new Error("Instagram posts require an image")
      }

      // Publish the media
      const publishResponse = await fetch(`https://graph.instagram.com/v18.0/${userId}/media_publish`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          creation_id: mediaId,
          access_token: accessToken,
        }),
      })

      if (!publishResponse.ok) {
        const error = await publishResponse.json()
        throw new Error(error.error?.message || "Failed to publish Instagram post")
      }

      const publishData = await publishResponse.json()

      return {
        success: true,
        platformPostId: publishData.id,
      }
    } catch (error) {
      console.error("Instagram posting error:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  // LinkedIn API integration
  static async postToLinkedIn(accessToken: string, userId: string, post: SocialMediaPost): Promise<PostResult> {
    try {
      const linkedinApiUrl = "https://api.linkedin.com/v2/ugcPosts"

      const postData = {
        author: `urn:li:person:${userId}`,
        lifecycleState: "PUBLISHED",
        specificContent: {
          "com.linkedin.ugc.ShareContent": {
            shareCommentary: {
              text: post.content,
            },
            shareMediaCategory: post.imageUrl ? "IMAGE" : "NONE",
            ...(post.imageUrl && {
              media: [
                {
                  status: "READY",
                  description: {
                    text: "Image description",
                  },
                  media: post.imageUrl,
                  title: {
                    text: "Post Image",
                  },
                },
              ],
            }),
          },
        },
        visibility: {
          "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
        },
      }

      const response = await fetch(linkedinApiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "X-Restli-Protocol-Version": "2.0.0",
        },
        body: JSON.stringify(postData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to post to LinkedIn")
      }

      const responseData = await response.json()

      return {
        success: true,
        platformPostId: responseData.id,
      }
    } catch (error) {
      console.error("LinkedIn posting error:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  // Facebook API integration
  static async postToFacebook(accessToken: string, pageId: string, post: SocialMediaPost): Promise<PostResult> {
    try {
      const facebookApiUrl = `https://graph.facebook.com/v18.0/${pageId}/feed`

      const postData = {
        message: post.content,
        access_token: accessToken,
        ...(post.imageUrl && { link: post.imageUrl }),
      }

      const response = await fetch(facebookApiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(postData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || "Failed to post to Facebook")
      }

      const responseData = await response.json()

      return {
        success: true,
        platformPostId: responseData.id,
      }
    } catch (error) {
      console.error("Facebook posting error:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  // Twitter API integration
  static async postToTwitter(
    accessToken: string,
    accessTokenSecret: string,
    post: SocialMediaPost,
  ): Promise<PostResult> {
    try {
      // Twitter API v2
      const twitterApiUrl = "https://api.twitter.com/2/tweets"

      const postData = {
        text: post.content,
      }

      // Note: Twitter API requires OAuth 1.0a authentication
      // This is a simplified example - you'll need proper OAuth implementation
      const response = await fetch(twitterApiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(postData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || "Failed to post to Twitter")
      }

      const responseData = await response.json()

      return {
        success: true,
        platformPostId: responseData.data.id,
      }
    } catch (error) {
      console.error("Twitter posting error:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  // Generic post method that routes to the appropriate platform
  static async publishPost(
    platform: string,
    accessToken: string,
    userId: string,
    post: SocialMediaPost,
    additionalParams?: any,
  ): Promise<PostResult> {
    switch (platform.toLowerCase()) {
      case "instagram":
        return this.postToInstagram(accessToken, userId, post)
      case "linkedin":
        return this.postToLinkedIn(accessToken, userId, post)
      case "facebook":
        return this.postToFacebook(accessToken, additionalParams?.pageId || userId, post)
      case "twitter":
        return this.postToTwitter(accessToken, additionalParams?.accessTokenSecret, post)
      default:
        return {
          success: false,
          error: `Platform ${platform} not supported`,
        }
    }
  }
}
