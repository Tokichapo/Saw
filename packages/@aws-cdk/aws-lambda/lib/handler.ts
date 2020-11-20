/**
 * Lambda function handler
 */
export class Handler {
  /**
   * A special handler when the function handler is part of a Docker image.
   */
  public static readonly FROM_IMAGE = 'FROM_IMAGE';

  /**
   * Your own handler string
   */
  public static custom(handler: string) {
    return handler;
  }
}