import { add24Hours, calculateTimeDifference, toKyivDayMonth } from './dateUtils.js';

export const formatScheduleText = (hoursData, timeZone, timeType) => {
  if (!hoursData || !timeZone || !timeType) return "";

  const segments = [];

  const addSegment = (from, to, status) => {
    if (!from || !to || !status) return;
    segments.push({ from, to, status });
  };

  Object.keys(hoursData).sort((a, b) => a - b).forEach(h => {
    const status = hoursData[h];
    const [, start, end] = timeZone[h];

    if (status === "first") {
      addSegment(start, start.replace(":00", ":30"), "no");
      addSegment(start.replace(":00", ":30"), end, "yes");
    } else if (status === "second") {
      addSegment(start, start.replace(":00", ":30"), "yes");
      addSegment(start.replace(":00", ":30"), end, "no");
    } else if (status === "mfirst" || status === "msecond") {
      addSegment(start, end, status);
    } else {
      addSegment(start, end, status);
    }
  });

  // Merge adjacent segments with same status
  const merged = [];
  for (const s of segments) {
    const last = merged[merged.length - 1];
    if (last && last.status === s.status && last.to === s.from) {
      last.to = s.to;
    } else {
      merged.push({ ...s });
    }
  }

  return merged
    .map(s => `• ${s.from} – ${s.to} — ${timeType[s.status]}`)
    .join("\n");
};

const buildScheduleBlocks = (todayUNIX, tomorrowUNIX, hoursDataToday, hoursDataTomorrow, preset) => {
  const scheduleToday = formatScheduleText(
    hoursDataToday,
    preset?.time_zone,
    preset?.time_type
  );

  const scheduleTomorrow = formatScheduleText(
    hoursDataTomorrow,
    preset?.time_zone,
    preset?.time_type
  );

  console.log('Formatted schedule text:', scheduleToday);

  const blocks = [
    `Графік відключень на ${toKyivDayMonth(todayUNIX)}:\n${scheduleToday}`,
  ];

  if (hoursDataTomorrow) {
    blocks.push(`Графік відключень на ${toKyivDayMonth(tomorrowUNIX)}:\n${scheduleTomorrow}`);
  }

  return blocks;
};

const buildNoOutageMessage = (street, houseGroup, scheduleBlocks, updateTimestamp) => {
  return [
    `Інформація про відключення на ${street} (${houseGroup}) відсутня.`,
    ...scheduleBlocks,
    `Якщо в даний момент у вас відсутнє світло, імовірно виникла аварійна ситуація, або діють стабілізаційні або екстрені відключення.`,
    `Дата оновлення інформації: ${updateTimestamp}`,
  ].join('\n\n');
};

const buildOutageMessage = (street, houseGroup, house, currentDate, scheduleBlocks, updateTimestamp) => {
  const timeSince = calculateTimeDifference(house.start_date, currentDate) || 'Невідомо';
  const timeUntil = calculateTimeDifference(house.end_date, currentDate) || 'Невідомо';

  return [
    `За адресою ${street} (${houseGroup}) зафіксовано: \n${house.sub_type}`,
    `Початок: ${house.start_date}\nКінець: ${house.end_date}`,
    `Без світла: ${timeSince}\nДо відновлення залишилось: ${timeUntil}`,
    ...scheduleBlocks,
    `Дата оновлення інформації: ${updateTimestamp}`,
  ].join('\n\n');
};

export const formatDTEKMessage = (
  house,
  street,
  currentDate,
  updateTimestamp,
  fact,
  preset
) => {
  const reasonKey = house?.sub_type_reason?.[0];

  const houseGroup =
    preset?.sch_names?.[reasonKey] ||
    reasonKey?.slice(-3) ||
    'Невідомо';

  const todayUNIX = fact?.today;
  const tomorrowUNIX = add24Hours(todayUNIX);
  const hoursDataToday = fact?.data?.[todayUNIX]?.[reasonKey];
  const hoursDataTomorrow = fact?.data?.[tomorrowUNIX]?.[reasonKey];

  const scheduleBlocks = buildScheduleBlocks(
    todayUNIX,
    tomorrowUNIX,
    hoursDataToday,
    hoursDataTomorrow,
    preset
  );

  const hasOutagePeriod = house?.sub_type && (house?.start_date || house?.end_date);

  if (!hasOutagePeriod) {
    return buildNoOutageMessage(street, houseGroup, scheduleBlocks, updateTimestamp);
  }

  return buildOutageMessage(
    street,
    houseGroup,
    house,
    currentDate,
    scheduleBlocks,
    updateTimestamp
  );
};
