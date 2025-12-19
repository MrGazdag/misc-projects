import {GLProgram, GLRenderer, GLTexture} from "@mrgazdag/gl-lite";
import podiumVsh from "./CalendarComponent.vsh";
import podiumFsh from "./CalendarComponent.fsh";
import AbstractComponent from "./AbstractComponent";
import {ComponentContext} from "../F1Renderer";
import TextureUtils from "../TextRenderer";

export default class CalendarComponent extends AbstractComponent {
    private textureCacheMap = new Map<string,GLTexture>();
    private program!: GLProgram<InterpolatedImageProps>;

    private allRaceData!: CalendarRaceData[];

    shouldRender(context: ComponentContext): boolean {
        return context.mode.checkValue(e=>e==5);
    }

    private getImageTexture(renderer: GLRenderer, key: string, value: HTMLImageElement) {
        if (this.textureCacheMap.has(key)) {
            return this.textureCacheMap.get(key)!;
        }
        let result = renderer.texture({
            data: value,

            width: value.width,
            height: value.height,
            format: "rgba",
            flipY: true,
        });
        this.textureCacheMap.set(key, result);
        return result!;
    }
    private getTextTexture(renderer: GLRenderer, key: string, value: string, bold: boolean) {
        if (this.textureCacheMap.has(key)) {
            return this.textureCacheMap.get(key)!;
        }
        const font = {family: "Formula1",size:"60px",weight: bold ? "bold" : "normal"};
        let result = TextureUtils.updateOrNew(renderer, undefined, TextureUtils.renderText(font, value));
        this.textureCacheMap.set(key, result);
        return result!;
    }
    private getMultiTextTexture(renderer: GLRenderer, key: string, value: string[], align: "left"|"center"|"right", bold: boolean) {
        if (this.textureCacheMap.has(key)) {
            return this.textureCacheMap.get(key)!;
        }
        const font = {family: "Formula1",size:"60px",weight: bold ? "bold" : "normal"};
        let result = TextureUtils.updateOrNew(renderer, undefined, TextureUtils.renderMultilineIndexed(font, value, align));
        this.textureCacheMap.set(key, result);
        return result!;
    }

    /**
     * Internal: get timezone offset in minutes for a given instant and time zone.
     * Positive = ahead of UTC, negative = behind UTC.
     */
    private static getTimezoneOffsetMinutes(date: Date, timeZone: string) {
        const dtf = new Intl.DateTimeFormat("en-US", {
            timeZone,
            hour12: false,
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        });

        const parts = Object.fromEntries(
            dtf.formatToParts(date)
                .map(e=>[e.type, Number(e.value)])
        ) as Record<Intl.DateTimeFormatPartTypes,number|undefined>;

        let year     = parts.year!;
        let month    = parts.month!;
        let day      = parts.day!;
        let hour     = parts.hour!;
        let minute   = parts.minute!;
        const second = parts.second!;

        // This is what that local time would be as a UTC timestamp
        const asUTC = Date.UTC(year, month - 1, day, hour, minute, second);
        const utcTs = date.getTime();

        return (asUTC - utcTs) / 60000; // minutes
    }

    /**
     * Internal: determine if `date` is in DST for a given time zone.
     */
    private static isInDST(date: Date, timeZone: string) {
        const year = date.getUTCFullYear();

        const jan = new Date(Date.UTC(year, 0, 1));
        const jul = new Date(Date.UTC(year, 6, 1));

        const janOffset = this.getTimezoneOffsetMinutes(jan, timeZone);
        const julOffset = this.getTimezoneOffsetMinutes(jul, timeZone);
        const currentOffset = this.getTimezoneOffsetMinutes(date, timeZone);

        if (janOffset === julOffset) {
            // No DST in this zone
            return false;
        }

        const dstOffset = Math.max(janOffset, julOffset);
        return currentOffset === dstOffset;
    }

    public static formatMultiTimeZones(date: Date) {
        let result = [];
        for (let zone of ZONES) {
            // Figure out DST or not
            let label = this.isInDST(date, zone.timezone) && zone.display[1]
                ? zone.display[1]
                : zone.display[0];

            // Get local date/time parts for that time zone
            const dtf = new Intl.DateTimeFormat("en-US", {
                timeZone: zone.timezone,
                hour12: zone.hour12,
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit"
            });
            const parts = Object.fromEntries(
                dtf.formatToParts(date)
                .map(e=>[e.type, e.value])
            ) as Record<Intl.DateTimeFormatPartTypes,string|undefined>;

            let year      = parts.year!;
            let month     = parts.month!;
            let day       = parts.day!;
            let hour      = parts.hour!;
            let minute    = parts.minute!;
            let dayPeriod = parts.dayPeriod!;

            const monthIndex  = Number(month) - 1;
            const monthAbbr   = MONTH_ABBR[monthIndex];
            const monthName   = MONTH_NAMES[monthIndex];

            const shortDate = `${monthAbbr} — ${day}`;               // "JAN-31"
            const longDate = `${year}. ${monthName} ${day}.`;  // "2025. January 31."

            let shortTime;
            if (zone.hour12) {
                // 12-hour clock: "5:00 PM"
                shortTime = `${hour}:${minute}${dayPeriod ? ` ${dayPeriod}` : ""}`;
            } else {
                // 24-hour clock: "17:00"
                shortTime = `${hour}:${minute}`;
            }
            let longTime = `${shortTime} ${label}`;


            result.push({
                timezone: label,
                shortDate: shortDate,

                month: monthAbbr,
                dash: " — ",
                day: day,

                longDate: longDate,
                shortTime: shortTime,
                longTime: longTime
            });
        }

        return result;
    }


    init(renderer: GLRenderer, context: ComponentContext): void {
        // Create a shader program
        this.program = this.createRect<InterpolatedImageProps>(renderer, context, {
            vert: podiumVsh,
            frag: podiumFsh,
            uniforms: {
                iTime: props => props.time,
                iResolution: props => props.screen,
                iMode: props=>props.mode,
                iRaceIndex: props => props.raceIndex,

                position: props => [props.position, this.allRaceData.length],

                nextUpTx: this.getTextTexture(renderer, "next_up", " — NEXT RACE", true),
                raceNumberTx: props => props.raceNumberTx,
                nameTx: props => props.nameTx,
                flagTx: props => props.flagTx,

                monthTx: props => props.monthTx,
                dashTx: props => props.dashTx,
                dayTx: props => props.dayTx,

                longDateTx: props => props.longDateTx,
                shortTimeTx: props => props.shortTimeTx,
                longTimeTx: props => props.longTimeTx,
                timeZoneTx: props => props.timeZoneTx,

                lapsTx: props => props.lapsTx,
                //mapTex: props => props.mapTx
            },
        });

        this.allRaceData = [];
        let max = context.gameData.getAllRaceData().length;
        for (let i = 0; i < max; i++){
            let raceData = context.gameData.getAllRaceData()[i];
            let date = raceData.getDate();
            let multi = CalendarComponent.formatMultiTimeZones(date);

            let month = multi.map(e=>e.month);
            let dash = multi.map(e=>e.dash);
            let day = multi.map(e=>e.day);

            let fullDate = multi.map(e=>e.longDate);
            let shortTime = multi.map(e=>e.shortTime);
            let longTime = multi.map(e=>e.longTime);
            let timezone = multi.map(e=>e.timezone);

            let laps = raceData.getLapCount();

            this.allRaceData.push({
                raceNumberTx: this.getTextTexture(renderer, "race_number_" + i, "R" + (i+1), true),
                nameTx: this.getTextTexture(renderer, "map_name_" + raceData.getMap(), raceData.getMap(), true),
                flagTx: this.getImageTexture(renderer, "flag_" + raceData.getCountry(), raceData.getFlag()),

                monthTx: this.getMultiTextTexture(renderer, "short_date_month_" + date.toDateString(), month, "right", true),
                dashTx: this.getMultiTextTexture(renderer, "short_date_dash_" + date.toDateString(), dash, "center", true),
                dayTx: this.getMultiTextTexture(renderer, "short_date_day_" + date.toDateString(), day, "left", true),

                longDateTx: this.getMultiTextTexture(renderer, "long_date_" + date.toDateString(), fullDate, "left", true),
                shortTimeTx: this.getMultiTextTexture(renderer, "time_short_" + date.toDateString(), shortTime, "right", true),
                longTimeTx: this.getMultiTextTexture(renderer, "time_long_" + date.toDateString(), longTime, "center", true),
                timeZoneTx: this.getMultiTextTexture(renderer, "timezones_" + date.toDateString(), timezone, "left", true),

                lapsTx: this.getTextTexture(renderer, "laps_" + laps, laps + " lap" + (laps == 1 ? "" : "s"), false),
                //map: this.getTextTexture(renderer, "podium_position_" + i, Positions[i], true),
            });
        }
    }
    render(renderer: GLRenderer, context: ComponentContext): void {
        for (let i = 0; i < this.allRaceData.length; i++){
            let raceData = this.allRaceData[i];
            this.program.draw({
                time: context.time.delta,
                screen: context.screen,
                mode: context.mode.asVec4(),
                raceIndex: context.raceIndex.asVec4(),

                position: i,

                raceNumberTx: raceData.raceNumberTx,
                nameTx: raceData.nameTx,
                flagTx: raceData.flagTx,

                monthTx: raceData.monthTx,
                dashTx: raceData.dashTx,
                dayTx: raceData.dayTx,

                longDateTx: raceData.longDateTx,
                shortTimeTx: raceData.shortTimeTx,
                longTimeTx: raceData.longTimeTx,
                timeZoneTx: raceData.timeZoneTx,

                lapsTx: raceData.lapsTx,
                //mapTx: raceData.map,
            });
        }
    }

    dispose() {
        this.program.dispose();
    }
}
const Positions = [
    "1st",
    "2nd",
    "3rd",
]
interface InterpolatedImageProps {
    time: number;
    screen: [number, number];
    mode: [number, number, number, number];
    raceIndex: [number, number, number, number]

    position: number,

    raceNumberTx: GLTexture,
    flagTx: GLTexture,
    nameTx: GLTexture,

    monthTx: GLTexture,
    dashTx: GLTexture,
    dayTx: GLTexture,

    longDateTx: GLTexture,
    shortTimeTx: GLTexture,
    longTimeTx: GLTexture,
    timeZoneTx: GLTexture,

    lapsTx: GLTexture,
    //mapTx: GLTexture,
}
interface CalendarRaceData {
    raceNumberTx: GLTexture,
    flagTx: GLTexture,
    nameTx: GLTexture,

    monthTx: GLTexture,
    dashTx: GLTexture,
    dayTx: GLTexture,

    longDateTx: GLTexture,
    shortTimeTx: GLTexture,
    longTimeTx: GLTexture,
    timeZoneTx: GLTexture,

    lapsTx: GLTexture,
    //mapTx: GLTexture,
}
const ZONES = [
    {timezone: "Europe/Budapest", display: ["CET","CEST"], hour12: false},
    {timezone: "America/New_York", display: ["EDT","EST"], hour12: true},
    {timezone: "Europe/London", display: ["GMT","BST"], hour12: false},
    {timezone: "Etc/UTC", display: ["UTC","UTC"], hour12: false},
]
const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

const MONTH_ABBR = [
    "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
    "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"
];
