import { JSDOM } from "jsdom";
import { writeFile } from "fs/promises";

const SCHEDULE_URL =
	"https://www.sjsu.edu/classes/schedules/{season}-{year}.php";

const TABLE_HEADING_PROPS = {
	Section: {
		process: (section, td) => {
			section.section = td.textContent;
			section.section_url = td.querySelector("a")?.href;
		},
	},
	"Class Number": { name: "class_number" },
	"Mode of Instruction": { name: "instruction_mode" },
	"Course Title": { name: "course_title" },
	Satisifies: { name: "satisfies" },
	Units: { name: "units" },
	Type: { name: "type" },
	Days: { name: "days" },
	Times: { name: "times" },
	Instructor: {
		process: (section, td) => {
			section.instructor = td.textContent;
			section.instructor_email = td.querySelector("a")?.href.replace("mailto:", "");
		},
	},
	Location: { name: "location" },
	Dates: { name: "dates" },
	"Open Seats": { name: "open_seats" },
	Notes: { name: "notes" },
};

export async function getSections(season, year) {
	const {
		window: { document },
	} = await JSDOM.fromURL(
		SCHEDULE_URL.replaceAll("{season}", season).replaceAll("{year}", year)
	);
	const scheduleTable = document.querySelector("#classSchedule");
	const tableColumnProcessors = [
		...scheduleTable.querySelectorAll("thead tr th"),
	].map((th) => {
		return TABLE_HEADING_PROPS[th.textContent];
	});

	return [...scheduleTable.querySelectorAll("tbody tr")].map((tr) => {
		const section = {};
		[...tr.querySelectorAll("td")].forEach((td, i) => {
			const column = tableColumnProcessors[i];
			if (!column) return;

			if (column.name) {
				section[column.name] = td.textContent.trim();
			} else if (column.process) {
				column.process(section, td);
			}
		});
		return section;
	});
}

(async () => {
	const sections = await getSections("spring", 2025);
	await writeFile("sections.json", JSON.stringify(sections), "utf-8");
})();
