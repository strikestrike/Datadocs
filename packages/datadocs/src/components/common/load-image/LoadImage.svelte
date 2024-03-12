<script lang="ts">
  export let imageUrl: string;

  export let isLoaded: boolean;
  export let isSuccess: boolean;
  export let imageElement: HTMLImageElement = null;

  function validateUrl(url: string) {
    try {
      new URL(url);
      return true;
    } catch (error) {
      return false;
    }
  }

  function loadImage() {
    if (!validateUrl(imageUrl)) {
      return onImageLoaded(false);
    }

    imageElement = new Image();
    imageElement.addEventListener("load", () => onImageLoaded(true));
    imageElement.addEventListener("error", () => onImageLoaded(false));
    imageElement.src = imageUrl;
  }

  function onImageLoaded(success: boolean) {
    isLoaded = true;
    isSuccess = success; 
  }

  loadImage();
</script>
