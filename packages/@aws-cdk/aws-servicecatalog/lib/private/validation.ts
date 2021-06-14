/**
 * Class to validate that inputs match requirements.
 */
export class InputValidator {
  /**
   * Validates length is between allowed min and max lengths.
   */
  public static validateLength(resourceName: string, inputName: string, minLength: number, maxLength: number, inputString?: string): void {
    if (inputString !== undefined && (inputString.length < minLength || inputString.length > maxLength)) {
      throw new Error(`Invalid ${inputName} length of ${inputString.length} for ${resourceName}, ${inputName} length must be between ${minLength} and ${maxLength}\n` +
      `${inputName}: ${this.truncateString(inputString, 100)}`);
    }
  }

  private static truncateString(string: string, maxLength: number): string {
    if (string.length > maxLength) {
      return string.substring(0, maxLength) + '[truncated]';
    }
    return string;
  }
}
