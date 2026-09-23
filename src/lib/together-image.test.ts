import { afterEach, describe, expect, it } from "vitest";
import { illustrationModel, togetherImageBody } from "./together-image";

describe("Together Qwen image request", () => {
  const previous = process.env.TOGETHER_IMAGE_MODEL;

  afterEach(() => {
    if (previous === undefined) delete process.env.TOGETHER_IMAGE_MODEL;
    else process.env.TOGETHER_IMAGE_MODEL = previous;
  });

  it("asks Qwen Image 2.0 for a clean 3:4 portrait", () => {
    delete process.env.TOGETHER_IMAGE_MODEL;
    const body = togetherImageBody({
      prompt: "ivory silk shirt",
      referenceImageUrl: "https://example.com/selfie.jpg",
    });
    expect(body.model).toBe("Qwen/Qwen-Image-2.0");
    expect(body.width).toBe(768);
    expect(body.height).toBe(1024);
    expect(body.image_url).toBe("https://example.com/selfie.jpg");
    expect(illustrationModel()).toBe("Qwen/Qwen-Image-2.0");
  });

  it("lets the house pick the cheaper Qwen Image model", () => {
    process.env.TOGETHER_IMAGE_MODEL = "Qwen/Qwen-Image";
    expect(togetherImageBody({ prompt: "wool coat" }).model).toBe("Qwen/Qwen-Image");
  });
});
