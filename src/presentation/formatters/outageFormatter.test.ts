import { formatNoOutageMessage, formatActiveOutageMessage } from "./outageFormatter";

describe("outageFormatter", () => {
  describe("formatNoOutageMessage", () => {
    it("includes houseGroup in output", () => {
      const result = formatNoOutageMessage({
        houseGroup: "Черга 1.1",
        scheduleBlocks: [],
        powerStats: null,
        updateTimestamp: "12:00 15.06.2025",
      } as any);

      expect(result).toContain("Черга 1.1");
    });

    it("includes schedule blocks", () => {
      const result = formatNoOutageMessage({
        houseGroup: "Черга 2.1",
        scheduleBlocks: ["📅 Графік: 08:00-12:00", "📅 Графік: 14:00-18:00"],
        powerStats: null,
        updateTimestamp: "12:00 15.06.2025",
      } as any);

      expect(result).toContain("📅 Графік: 08:00-12:00");
      expect(result).toContain("📅 Графік: 14:00-18:00");
    });

    it("includes powerStats", () => {
      const result = formatNoOutageMessage({
        houseGroup: "Черга 3.2",
        scheduleBlocks: [],
        powerStats: { region: "Регіон", lightPercent: 95 },
        updateTimestamp: "12:00 15.06.2025",
      } as any);

      expect(result).toContain("📊 Регіон:");
      expect(result).toContain("95% з електропостачанням");
    });

    it("includes updateTimestamp", () => {
      const result = formatNoOutageMessage({
        street: "вул. Тестова",
        houseGroup: "Черга 4.1",
        scheduleBlocks: [],
        powerStats: null,
        updateTimestamp: "14:30 20.06.2025",
      } as any);

      expect(result).toContain("14:30 20.06.2025");
    });

    it("escapes HTML in dynamic strings", () => {
      const result = formatNoOutageMessage({
        street: "Вулиця Зразкова",
        houseGroup: "<b>група</b>",
        scheduleBlocks: [],
        powerStats: null,
        updateTimestamp: "12:00 15.06.2025",
      } as any);

      // Only test what's actually in the output
      expect(result).toContain("&lt;b&gt;група&lt;/b&gt;");
      expect(result).not.toContain("<b>група</b>");
    });

    it("filters out falsy parts", () => {
      const result = formatNoOutageMessage({
        street: "вул. Перша",
        houseGroup: "Черга 5.1",
        scheduleBlocks: [],
        powerStats: null,
        updateTimestamp: "12:00 15.06.2025",
      } as any);

      expect(result).not.toContain("\n\n\n");
    });
  });

  describe("formatActiveOutageMessage", () => {
    it("includes houseGroup and house.sub_type in output", () => {
      const result = formatActiveOutageMessage({
        street: "вул. Друга",
        houseGroup: "Черга 6.1",
        house: {
          sub_type: "Планове відключення",
          start_date: "10:00 15.06.2025",
          end_date: "18:00 15.06.2025",
        },
        currentDate: "12:00 15.06.2025",
        scheduleBlocks: [],
        powerStats: null,
        updateTimestamp: "12:00 15.06.2025",
      } as any);

      expect(result).toContain("Черга 6.1");
      expect(result).toContain("Планове відключення");
    });

    it("includes outage period when dates are parseable same-day", () => {
      const result = formatActiveOutageMessage({
        street: "вул. Третя",
        houseGroup: "Черга 1.2",
        house: {
          sub_type: "Аварійне відключення",
          start_date: "10:00 15.06.2025",
          end_date: "18:00 15.06.2025",
        },
        currentDate: "12:00 15.06.2025",
        scheduleBlocks: [],
        powerStats: null,
        updateTimestamp: "12:00 15.06.2025",
      } as any);

      expect(result).toContain("Вимкнення:");
      expect(result).toContain("Відновлення:");
      expect(result).toContain("10:00");
      expect(result).toContain("18:00");
    });

    it("includes outage period when dates are unparseable", () => {
      const result = formatActiveOutageMessage({
        street: "вул. Четверта",
        houseGroup: "Черга 2.2",
        house: {
          sub_type: "Невідоме відключення",
          start_date: "невідомо початок",
          end_date: "невідомо кінець",
        },
        currentDate: "12:00 15.06.2025",
        scheduleBlocks: [],
        powerStats: null,
        updateTimestamp: "12:00 15.06.2025",
      } as any);

      expect(result).toContain("Вимкнення:");
      expect(result).toContain("Відновлення:");
      expect(result).toContain("невідомо початок");
      expect(result).toContain("невідомо кінець");
    });

    it("includes outage period when dates span different days", () => {
      const result = formatActiveOutageMessage({
        street: "вул. П'ята",
        houseGroup: "Черга 3.1",
        house: {
          sub_type: "Планове відключення",
          start_date: "22:00 15.06.2025",
          end_date: "06:00 16.06.2025",
        },
        currentDate: "23:00 15.06.2025",
        scheduleBlocks: [],
        powerStats: null,
        updateTimestamp: "23:00 15.06.2025",
      } as any);

      expect(result).toContain("Вимкнення:");
      expect(result).toContain("Відновлення:");
      expect(result).toContain("22:00");
      expect(result).toContain("06:00");
    });

    it("escapes HTML in house.sub_type", () => {
      const result = formatActiveOutageMessage({
        street: "вул. Шоста",
        houseGroup: "Черга 4.2",
        house: {
          sub_type: "<img src=x onerror=alert(1)>",
          start_date: "10:00 15.06.2025",
          end_date: "18:00 15.06.2025",
        },
        currentDate: "12:00 15.06.2025",
        scheduleBlocks: [],
        powerStats: null,
        updateTimestamp: "12:00 15.06.2025",
      } as any);

      expect(result).toContain("&lt;img");
      expect(result).not.toContain("<img");
    });

    it("includes schedule blocks and powerStats", () => {
      const result = formatActiveOutageMessage({
        street: "вул. Сьома",
        houseGroup: "Черга 5.2",
        house: {
          sub_type: "Стабілізаційне відключення",
          start_date: "10:00 15.06.2025",
          end_date: "18:00 15.06.2025",
        },
        currentDate: "12:00 15.06.2025",
        scheduleBlocks: ["📅 Графік: 08:00-12:00"],
        powerStats: { region: "Регіон", lightPercent: 80 },
        updateTimestamp: "12:00 15.06.2025",
      } as any);

      expect(result).toContain("📅 Графік: 08:00-12:00");
      expect(result).toContain("📊 Регіон:");
      expect(result).toContain("80% з електропостачанням");
    });

    it("filters out falsy parts", () => {
      const result = formatActiveOutageMessage({
        street: "вул. Восьма",
        houseGroup: "Черга 6.2",
        house: {
          sub_type: "Аварійне відключення",
          start_date: "10:00 15.06.2025",
          end_date: "18:00 15.06.2025",
        },
        currentDate: "12:00 15.06.2025",
        scheduleBlocks: [],
        powerStats: null,
        updateTimestamp: "12:00 15.06.2025",
      } as any);

      expect(result).not.toContain("\n\n\n");
    });
  });
});
