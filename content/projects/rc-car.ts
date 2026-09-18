import type { CaseStudy } from "@/content/case-study";
import chassis from "@/public/images/projects/rc-car/chassis.webp";
import wiring from "@/public/images/projects/rc-car/wiring.webp";
import front from "@/public/images/projects/rc-car/front.webp";
import driving from "@/public/images/projects/rc-car/driving.webp";
import tennisBall from "@/public/images/projects/rc-car/tennis-ball.webp";

// Written from KalpKan/Automatic-RC-Car (ps4_controller_integrated.cpp,
// data_prep_scripts/, README_PS4_INTEGRATED.md, docs/project_plan_and_status.md
// in the local clone) and the two build videos on Kalp's Mac, from which the
// photos below are single frames. The videos themselves are not in the repo.

const rcCar: CaseStudy = {
  slug: "rc-car",
  kicker: "Robotics · C++ · 2025",
  title: "Automatic RC Car",
  lede:
    "A 3D-printed car on a Raspberry Pi that you drive with a PS4 controller over Bluetooth, and that can also chase a tennis ball on its own using a camera and a colour filter.",
  hero: {
    src: tennisBall,
    alt: "The RC car on a hardwood floor, turning toward a yellow-green tennis ball a few centimetres ahead of its camera",
    caption: "Autonomous mode: the car steers toward the largest green blob in the camera frame. Frame from the build video.",
    position: "50% 62%",
  },
  problem:
    "Most hobby RC cars are a radio and a motor. The goal here was a car whose every layer Kalp built or wrote: the chassis and gear train in CAD and on a 3D printer, the motor and steering wiring on a Raspberry Pi, a controller stack in C++ that reads a DualShock 4 the way the Linux kernel exposes it, and a vision loop simple enough to run on a Pi Zero 2W without a neural network. The finishing test was not a lap time; it was whether the car could find and follow a tennis ball on a hardwood floor with the controller set down.",
  howItWorks: {
    intro:
      "Two control paths share one drivetrain. In manual mode a C++ program turns PS4 stick and button events into throttle and steering; in autonomous mode an OpenCV loop finds the biggest green object in the Pi camera frame and steers toward it.",
    diagram: "rc-car",
    steps: [
      {
        title: "Chassis and drivetrain",
        body:
          "The body, the Raspberry Pi mount (three revisions), the N20 motor mounts and 14-tooth spur gears were modelled and printed at home; the wheels were designed in Inventor. The print files sit next to the code on Kalp's machine, not in the repo.",
      },
      {
        title: "Controller input",
        body:
          "ps4_controller_integrated.cpp runs two threads: one reads button presses straight from the Linux input device (/dev/input/event*, so Triangle, Cross, L1, R2 and the rest arrive as kernel events), the other polls the analog sticks through SDL2 at 20 Hz with a 0.1 dead-zone, mapping left-stick Y to throttle and right-stick X to steering. RAII cleanup, a Ctrl-C handler and a four-level debug log keep it usable on a headless Pi.",
      },
      {
        title: "Seeing green",
        body:
          "The autonomous path converts each frame to HSV, keeps the band from yellow-green to blue-green (H 25–45, S and V above 120), blurs, opens the mask twice and dilates once to kill speckle, then takes the bounding box of the largest contour and reports how much of the frame it covers. The thresholds were tuned with sliders on a live webcam, then checked against a sorted image set.",
      },
      {
        title: "Data, and why the repo was 943 MB",
        body:
          "To tune the filter, two open image sets (sports balls, fruit and vegetables) were sorted into green and non-green folders by the same HSV rule, resized to 320×240 and annotated with the largest green box: 64,273 images. They were committed by mistake, untracked in the last commit, and a pull request now documents the git filter-repo rewrite that will shrink the clone from 943 MB to a few hundred kilobytes.",
      },
      {
        title: "What is not finished",
        body:
          "The steering-command mapping (ball x-offset to steering angle) and the Pi Zero 2W port live in the build video and on the bench, not as committed code; the repo's plan lists them as the next steps. The car drives and follows the ball; the software that does it is not yet in one clean program.",
      },
    ],
  },
  gallery: {
    aspect: "9/16",
    items: [
      {
        src: chassis,
        alt: "The 3D-printed blue chassis on a desk with a steering servo and rear N20 motor wired in, before the electronics were mounted",
        caption: "Printed chassis, steering servo and the N20 gear motor.",
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
        caption: "Manual mode over Bluetooth with a DualShock 4.",
      },
    ],
  },
  // No phone app, so no screens section; the controller's terminal output is in the repo README.
  screens: null,
  video: {
    kind: "placeholder",
    label: "Build and driving video coming: Kalp has two clips on disk (100 s build log, 10 s autonomous run); they go on YouTube (unlisted), not in the repo",
    aspect: "9/16",
  },
  tech: [
    "C++17",
    "CMake",
    "SDL2",
    "Linux evdev",
    "Raspberry Pi",
    "Pi Camera",
    "OpenCV (Python)",
    "3D printing",
    "Autodesk Inventor",
  ],
  repo: "https://github.com/KalpKan/Automatic-RC-Car",
  status:
    "Working prototype: drives on a controller and follows a tennis ball · Repo history purge open as a pull request · Not a product",
  wanted: [
    "upload Videos/Car Video.mp4 (100 s) and Videos/Autonomous Car Video.mp4 (10 s) to YouTube as unlisted and send the links",
    "optional: 2 still photos taken on a phone (the frames above are pulled from video and are soft)",
  ],
};

export default rcCar;
