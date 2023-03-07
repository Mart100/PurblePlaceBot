
const displayMediaOptions = {
  video: {
    displaySurface: "window"
  },
  audio: false
}

async function startCapture() {

	let media = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions)
  try {
    $('#video')[0].srcObject = media
  } catch (err) {
    console.error(`Error: ${err}`)
  }
}