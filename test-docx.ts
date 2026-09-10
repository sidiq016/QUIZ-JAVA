import mammoth from "mammoth";
async function run() {
  const buf = Buffer.from("");
  try {
    const res = await mammoth.extractRawText({ buffer: buf });
    console.log("Success");
  } catch (e) {
    console.log("Error:", e);
  }
}
run();
