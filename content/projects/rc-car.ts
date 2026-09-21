import type { CaseStudy } from "@/content/case-study";
import chassisTop from "@/public/images/projects/rc-car/chassis-top.webp";
import wiring from "@/public/images/projects/rc-car/wiring.webp";
import front from "@/public/images/projects/rc-car/front.webp";
import driving from "@/public/images/projects/rc-car/driving.webp";
import floorRun from "@/public/images/projects/rc-car/floor-run.webp";
import drivePoster from "@/public/images/projects/rc-car/drive-poster.webp";

// Kalp's own description (docs/content/project-descriptions.md) sets the
// framing; the technical specifics are from KalpKan/Automatic-RC-Car
// (ps4_controller_integrated.cpp, data_prep_scripts/, README_PS4_INTEGRATED.md,
// docs/project_plan_and_status.md in the local clone). The chassis photo is
// Kalp's own (2026-09-20); the hero, the poster and the remaining gallery
// frames are single frames from his driving video, which is hosted in the
// Supabase Storage bucket `portfolio-media` (runbook "Host a video for a case
// study"), never in the repo.

/** The 77 s driving video (H.264 1080p, 21.6 MB), Supabase Storage, public bucket. */
const DRIVE_VIDEO_URL = "https://yzppfufqaekgaxcrsqxp.supabase.co/storage/v1/object/public/portfolio-media/rc-car/drive.mp4";

const rcCar: CaseStudy = {
  slug: "rc-car",
  kicker: "Robotics · C++ · 2025",
  title: "Automatic RC Car",
  lede:
    "A small RC car we built around a Raspberry Pi: drive it with a PS4 controller, or switch it to self-driving and it follows any green tennis ball you throw, using the computer-vision model loaded on the Pi.",
  hero: {
    src: floorRun,
    alt: "Seen from above on a hardwood floor: a white PS4 controller set down at the top left, the RC car with its Raspberry Pi and wiring beside it, and a yellow-green tennis ball a metre ahead",
    caption: "Controller down, ball thrown: the car is about to go after it on its own. Frame from the driving video.",
  },
  problem:
    "This is one of my hardware projects. Most hobby RC cars are a radio and a motor; I wanted one where every layer was ours: the chassis and gear train in CAD and on a 3D printer, the motor and steering wiring on a Raspberry Pi, a controller stack in C++ that reads a PS4 DualShock 4 the way the Linux kernel exposes it, and a computer-vision model that detects tennis balls, loaded onto the Pi so the car can drive itself. The finishing test was not a lap time. It was whether I could put the controller down, throw a green tennis ball across a hardwood floor, and watch the car go after it.",
  howItWorks: {
    intro:
      "Two control paths share one drivetrain. In manual mode a C++ program turns PS4 stick and button events into throttle and steering; in self-driving mode the vision loop on the Pi finds the tennis ball in the camera frame and steers toward it.",
    diagram: "rc-car",
    steps: [
      {
        title: "Chassis and drivetrain",
        body:
          "The body, the Raspberry Pi mount (three revisions), the N20 motor mounts and 14-tooth spur gears were modelled and printed at home; the wheels were designed in Inventor. The print files sit next to the code on my machine, not in the repo.",
      },
      {
        title: "Controller input",
        body:
          "ps4_controller_integrated.cpp runs two threads: one reads button presses straight from the Linux input device (/dev/input/event*, so Triangle, Cross, L1, R2 and the rest arrive as kernel events), the other polls the analog sticks through SDL2 at 20 Hz with a 0.1 dead-zone, mapping left-stick Y to throttle and right-stick X to steering. RAII cleanup, a Ctrl-C handler and a four-level debug log keep it usable on a headless Pi.",
      },
      {
        title: "Finding the tennis ball",
        body:
          "The detector on the Pi keys on the ball's colour. Each camera frame is converted to HSV, the band from yellow-green to blue-green is kept (H 25–45, S and V above 120), the mask is blurred, opened twice and dilated once to kill speckle, and the bounding box of the largest blob left is the ball; how much of the frame it covers says how close it is. The thresholds were tuned with sliders on a live webcam, then checked against a sorted image set.",
      },
      {
        title: "Training data, and why the repo was 943 MB",
        body:
          "To build the ball detector, two open image sets (sports balls, fruit and vegetables) were sorted into green and non-green folders, resized to 320×240, annotated with a YOLO-style box around the largest green region and split into train and validation sets: 64,273 images. They were committed by mistake, untracked in the last commit, and a pull request now documents the git filter-repo rewrite that will shrink the clone from 943 MB to a few hundred kilobytes.",
      },
      {
        title: "What is in the repo and what is on the bench",
        body:
          "The controller program, the colour-detection scripts and the dataset tooling are committed. The steering-command mapping (ball x-offset to steering angle) and the version running on the car live in the build video and on the bench, not as committed code; the repo's plan lists them as the next steps. The car drives on the controller and follows the ball; the software that does it is not yet in one clean program.",
      },
    ],
  },
  gallery: {
    aspect: "9/16",
    items: [
      {
        src: chassisTop,
        alt: "Top-down photo of the 3D-printed dark blue-grey chassis on a table: four wheels, an N20 gear motor at the back, an orange-and-brown steering servo at the front and a red and black wire pair, before the Raspberry Pi was mounted",
        caption: "The printed chassis: N20 motor at the back, steering servo at the front, before the Pi went on.",
      },
      {
        src: wiring,
        alt: "Top-down view of the finished car: a Raspberry Pi on a printed mount, a breadboard and a bundle of jumper wires over the drivetrain",
        caption: "The Pi, the breadboard and the wiring loom, seen from above.",
      },
      {
        src: front,
        alt: "The car head-on: Pi camera module on the front, ribbon cable curling up, red status LED lit, wheels on hardwood",
        caption: "Camera up front. Frame from the autonomous run.",
      },
      {
        src: driving,
        alt: "A hand holding a white PS4 controller in the foreground while the car sits on the floor ahead",
        caption: "Manual mode: a PS4 DualShock 4 over Bluetooth.",
      },
    ],
  },
  // No phone app, so no screens section; the controller's terminal output is in the repo README.
  screens: null,
  video: {
    kind: "file",
    url: DRIVE_VIDEO_URL,
    poster: {
      src: drivePoster,
      alt: "The RC car on a hardwood floor, seen from above, driving toward a tennis ball",
    },
    title: "Automatic RC Car: manual driving on the PS4 controller, then the autonomous tennis-ball run (77 s)",
  },
  tech: [
    "Raspberry Pi",
    "PS4 DualShock 4 (Bluetooth)",
    "C++17",
    "CMake",
    "SDL2",
    "Linux evdev",
    "Pi Camera",
    "OpenCV (Python)",
    "Computer vision",
    "3D printing",
    "Autodesk Inventor",
  ],
  repo: "https://github.com/KalpKan/Automatic-RC-Car",
  status:
    "Working prototype: drives on a PS4 controller and follows a green tennis ball on its own · Repo history purge open as a pull request · Not a product",
  wanted: [
    "optional: a phone photo of the finished car with the Pi and camera on (the wiring and camera frames are still pulled from video and are soft)",
  ],
};

export default rcCar;
