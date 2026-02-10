/* =========================
   ELEMENT HELPER
========================= */

const el = (type, props) => ({ type, props });

/* =========================
   IMAGE CONSTANTS
========================= */

export const IMAGE_WIDTH = 1020;
export const IMAGE_HEIGHT = 820;

const IMAGE_PADDING = 16;
const IMAGE_GAP = 10;

/* =========================
   GRID CONSTANTS
========================= */

const HOURS_PER_DAY = 24;
const HOURS_START = 0;

const COLS = 6;
const ROWS_PER_HALF = 2;
const HOURS_PER_HALF = COLS * ROWS_PER_HALF;

const CELL_SIZE = 150;
const CELL_RADIUS = 16;
const CELL_GAP = 12;

const SPLIT_RATIO = 0.5;

/* =========================
   TEXT CONSTANTS
========================= */

const TITLE_FONT_SIZE = 40;
const SUBTITLE_FONT_SIZE = 24;
const HOUR_FONT_SIZE = 40; // Slightly smaller to fit the range
const LABEL_FONT_SIZE = 22;

const TEXT_SHADOW = "0 2px 4px rgba(0, 0, 0, 0.6)";
const LABEL_OPACITY = 0.85;

/* =========================
   COLORS
========================= */

const COLORS = {
  green: "#22c55e",
  red: "#ef4444",
  yellow: "#eab308",
  bg: "#1a1a2e",
  divider: "#334155",
  title: "#e2e8f0",
  subtitle: "#94a3b8",
  legend: "#94a3b8",
  fallback: "#6b7280",
  textLight: "#ffffff",
};

/* =========================
   STATUS MODEL
========================= */

const STATUS = {
  yes: {
    bg: COLORS.green,
    label: "є",
    textColor: COLORS.textLight,
  },
  no: {
    bg: COLORS.red,
    label: "немає",
    textColor: COLORS.textLight,
  },
  maybe: {
    bg: COLORS.yellow,
    label: "можл.",
    textColor: COLORS.bg,
  },
  first: {
    split: "red-first",
  },
  second: {
    split: "green-first",
  },
};

/* =========================
   LEGEND
========================= */

const LEGEND_ITEMS = [
  { color: COLORS.green, label: "Є світло" },
  { color: COLORS.red, label: "Немає світла" },
  { color: COLORS.yellow, label: "Можливо" },
  { color: "linear-gradient(green/red)", label: "Частково" },
];

/* =========================
   SHARED STYLES
========================= */

const flex = { display: "flex" };

const cellBaseStyle = {
  ...flex,
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  width: `${CELL_SIZE}px`,
  height: `${CELL_SIZE}px`,
  borderRadius: `${CELL_RADIUS}px`,
};

const rowStyle = {
  ...flex,
  flexDirection: "row",
  gap: `${CELL_GAP}px`,
};

const columnStyle = {
  ...flex,
  flexDirection: "column",
  alignItems: "center",
  gap: `${CELL_GAP}px`,
};

/* =========================
   HELPERS
========================= */

const normalizeHour = (hour) => {
  const n = Number(hour);
  return n >= 1 && n <= HOURS_PER_DAY ? String(n) : null;
};

const formatHour = (hour) => {
  return String(hour).padStart(2, "0");
};

const formatTimeRange = (startHour) => {
  const start = formatHour(startHour);
  const endHour = startHour + 1;
  const end = endHour === 24 ? "24" : formatHour(endHour);
  return `${start}-${end}`;
};

const hourText = (hour, color) =>
  el("div", {
    style: {
      ...flex,
      fontSize: `${HOUR_FONT_SIZE}px`,
      fontWeight: "700",
      color,
      textShadow: TEXT_SHADOW,
    },
    children: formatTimeRange(hour),
  });

/* =========================
   CELL BUILDERS
========================= */

const buildSplitCell = (hour, greenFirst) =>
  el("div", {
    style: {
      ...cellBaseStyle,
      overflow: "hidden",
      position: "relative",
    },
    children: [
      el("div", {
        style: {
          width: "100%",
          height: `${SPLIT_RATIO * 100}%`,
          backgroundColor: greenFirst ? COLORS.green : COLORS.red,
        },
      }),
      el("div", {
        style: {
          width: "100%",
          height: `${SPLIT_RATIO * 100}%`,
          backgroundColor: greenFirst ? COLORS.red : COLORS.green,
        },
      }),
      el("div", {
        style: {
          ...flex,
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "absolute",
          inset: 0,
        },
        children: [
          hourText(hour, COLORS.textLight),
          el("div", {
            style: {
              fontSize: `${LABEL_FONT_SIZE}px`,
              color: COLORS.textLight,
              opacity: LABEL_OPACITY,
              marginTop: "2px",
              textShadow: TEXT_SHADOW,
            },
            children: "частково",
          }),
        ],
      }),
    ],
  });

const buildSolidCell = (hour, statusDef) =>
  el("div", {
    style: {
      ...cellBaseStyle,
      backgroundColor: statusDef.bg,
    },
    children: [
      hourText(hour, statusDef.textColor),
      el("div", {
        style: {
          fontSize: `${LABEL_FONT_SIZE}px`,
          color: statusDef.textColor,
          opacity: LABEL_OPACITY,
          marginTop: "2px",
          textShadow: TEXT_SHADOW,
        },
        children: statusDef.label,
      }),
    ],
  });

const buildCell = (hour, rawStatus) => {
  const status = STATUS[rawStatus];

  if (!status) {
    console.warn("Unknown status:", rawStatus);
    return buildSolidCell(hour, {
      bg: COLORS.fallback,
      label: "—",
      textColor: COLORS.textLight,
    });
  }

  if (status.split === "green-first") return buildSplitCell(hour, true);
  if (status.split === "red-first") return buildSplitCell(hour, false);

  return buildSolidCell(hour, status);
};

/* =========================
   GRID BUILDERS
========================= */

const buildRow = (hoursData, startHour) =>
  el("div", {
    style: rowStyle,
    children: Array.from({ length: COLS }, (_, i) => {
      const displayHour = startHour + i; // This is what shows on screen (0-23)
      const dataKey = normalizeHour(displayHour + 1); // API uses 1-24, so we add 1
      return buildCell(displayHour, hoursData[dataKey] ?? "no");
    }),
  });

const buildHalfSection = (hoursData, startHour) =>
  el("div", {
    style: columnStyle,
    children: Array.from({ length: ROWS_PER_HALF }, (_, i) =>
      buildRow(hoursData, startHour + i * COLS),
    ),
  });

/* =========================
   LEGEND
========================= */

const buildLegend = () =>
  el("div", {
    style: {
      ...flex,
      flexDirection: "row",
      gap: "30px",
      marginTop: "4px",
    },
    children: LEGEND_ITEMS.map(({ color, label }) =>
      el("div", {
        style: {
          ...flex,
          alignItems: "center",
          gap: "12px",
        },
        children: [
          el("div", {
            style: {
              width: "20px",
              height: "20px",
              borderRadius: "8px",
              background:
                color === "linear-gradient(green/red)"
                  ? `linear-gradient(${COLORS.green}, ${COLORS.red})`
                  : color,
            },
          }),
          el("div", {
            style: {
              fontSize: "20px",
              color: COLORS.legend,
            },
            children: label,
          }),
        ],
      }),
    ),
  });

/* =========================
   MAIN EXPORT
========================= */

export const COMBINED_IMAGE_WIDTH = 1020;
export const COMBINED_IMAGE_HEIGHT = 1540;

const buildDaySection = (hoursData, subtitle) =>
  el("div", {
    style: {
      ...flex,
      flexDirection: "column",
      alignItems: "center",
      gap: `${IMAGE_GAP}px`,
    },
    children: [
      el("div", {
        style: {
          fontSize: `${SUBTITLE_FONT_SIZE}px`,
          color: COLORS.subtitle,
        },
        children: subtitle,
      }),
      buildHalfSection(hoursData, HOURS_START),
      el("div", {
        style: {
          width: "90%",
          height: "2px",
          backgroundColor: COLORS.divider,
        },
      }),
      buildHalfSection(hoursData, HOURS_START + HOURS_PER_HALF),
    ],
  });

export const buildCombinedOutageTableElement = (
  todayHoursData = {},
  todayLabel,
  tomorrowHoursData = {},
  tomorrowLabel,
) =>
  el("div", {
    style: {
      ...flex,
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      width: `${COMBINED_IMAGE_WIDTH}px`,
      height: `${COMBINED_IMAGE_HEIGHT}px`,
      backgroundColor: COLORS.bg,
      padding: `${IMAGE_PADDING}px`,
      gap: `${IMAGE_GAP}px`,
    },
    children: [
      el("div", {
        style: {
          fontSize: `${TITLE_FONT_SIZE}px`,
          fontWeight: "700",
          color: COLORS.title,
        },
        children: "Графік відключень",
      }),
      buildDaySection(todayHoursData, `Сьогодні — ${todayLabel}`),
      el("div", {
        style: {
          width: "90%",
          height: "2px",
          backgroundColor: COLORS.divider,
        },
      }),
      buildDaySection(tomorrowHoursData, `Завтра — ${tomorrowLabel}`),
      buildLegend(),
    ],
  });

export const buildOutageTableElement = (hoursData = {}, dateLabel) => {
  const titleChildren = [
    el("div", {
      style: {
        fontSize: `${TITLE_FONT_SIZE}px`,
        fontWeight: "700",
        color: COLORS.title,
      },
      children: "Графік відключень",
    }),
  ];

  if (dateLabel) {
    titleChildren.push(
      el("div", {
        style: {
          fontSize: `${SUBTITLE_FONT_SIZE}px`,
          color: COLORS.subtitle,
        },
        children: dateLabel,
      }),
    );
  }

  return el("div", {
    style: {
      ...flex,
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      width: `${IMAGE_WIDTH}px`,
      height: `${IMAGE_HEIGHT}px`,
      backgroundColor: COLORS.bg,
      padding: `${IMAGE_PADDING}px`,
      gap: `${IMAGE_GAP}px`,
    },
    children: [
      el("div", {
        style: {
          ...flex,
          flexDirection: "column",
          alignItems: "center",
          gap: "4px",
        },
        children: titleChildren,
      }),
      buildHalfSection(hoursData, HOURS_START),
      el("div", {
        style: {
          width: "90%",
          height: "2px",
          backgroundColor: COLORS.divider,
        },
      }),
      buildHalfSection(hoursData, HOURS_START + HOURS_PER_HALF),
      buildLegend(),
    ],
  });
};
