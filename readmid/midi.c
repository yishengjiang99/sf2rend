#include <emscripten/fetch.h>
#include <stdio.h>
#include <string.h>
void downloadSucceeded(emscripten_fetch_t *fetch) {
  printf("Finishaaaed downloading %llu bytes from URL %s.\n", fetch->numBytes,
         fetch->url);
  unsigned long inc = 1L;
  // The data is now available at fetch->data[0] through
  for (unsigned long i = 0; i < 1111;) {
    switch (fetch->data[i] / 4 * 4) {
      case 0x80:
        printf("\nkey off: %x %x %x \n", fetch->data[i] & 0x0f,
               fetch->data[i + 1] & 0x7f, fetch->data[i + 2] & 0x7f);
        i += 3;
        break;
      case 0x90:
        printf("\nkey on:  %x %x %x", fetch->data[i] & 0x0f,
               fetch->data[i + 1] & 0x7f, fetch->data[i + 2] & 0x7f);
        i += 3;
        break;
      case 0xa0:
        printf("\nchange control:  %x %x %x  ", fetch->data[i] & 0x0f,
               fetch->data[i + 1] & 0x7f, fetch->data[i + 2] & 0x7f);
        i += 3;
        break;
      case 0xc0:
        printf("\program change control: %x %x ", fetch->data[i] & 0x0f,
               fetch->data[i + 1] & 0x7f);
        i += 2;
        break;
      case 0xb0:
      case 0xd0:
      case 0xe0:
        printf("\ncn: %x %u %u %u", fetch->data[i] & 0xf0,
               fetch->data[i] & 0x0f, fetch->data[i + 1] & 0x7f,
               fetch->data[i + 2] & 0x7f);
        i += 3;
        break;
      default:
        i++;
        break;
    }
  }
}

void downloadFailed(emscripten_fetch_t *fetch) {
  printf("aaa %s failed, HTTP failure status code: %d.\n", fetch->url,
         fetch->status);
  emscripten_fetch_close(fetch);  // Also free data on failure.
}

void downloadProgress(emscripten_fetch_t *fetch) {
  if (fetch->totalBytes) {
    printf("Downloadaaaaing %s.. %.2f%% complete.\n", fetch->url,
           fetch->dataOffset * 100.0 / fetch->totalBytes);
    // The data is now available at fetch->data[0] through
    for (int i = 0; i < fetch->numBytes; i++) {
      if (fetch->data[i] >> 4 == 0x08) {
        printf("\nkey off: %x %x %x ", fetch->data[i] & 0x0f,
               fetch->data[i + 1] & 0x7f, fetch->data[i + 2] & 0x7f);
      } else if (fetch->data[i] >> 4 == 0x09) {
        printf("\nkey on:  %u %u %u", fetch->data[i] & 0x0f,
               fetch->data[i + 1] & 0x7f, fetch->data[i + 2] & 0x7f);
      } else if (fetch->data[i] >> 4 == 0x0c) {
        printf("\nchange program:  %u %u ", fetch->data[i] & 0x0f,
               fetch->data[i + 1] & 0x7f);
      }
    }
  } else {
    printf("Downloading %s.. %lld bytes complete.\n", fetch->url,
           fetch->dataOffset + fetch->numBytes);
  }
}

int main() {
  emscripten_fetch_attr_t attr;
  emscripten_fetch_attr_init(&attr);
  strcpy(attr.requestMethod, "GET");
  attr.attributes = EMSCRIPTEN_FETCH_LOAD_TO_MEMORY;
  attr.onsuccess = downloadSucceeded;
  attr.onprogress = downloadProgress;
  attr.onerror = downloadFailed;
  emscripten_fetch(
      &attr,
      "https://grep32bit.blob.core.windows.net/midi/2212bagat6Steven.mid");
}