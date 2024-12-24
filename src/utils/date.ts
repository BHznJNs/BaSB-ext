export function getTodayDate(): string {
    const today = new Date();
    const formattedDate = today
        .toLocaleDateString('zh-CN', )
        .replace(/\//g, '-');
    return formattedDate;
}

export function getWeekNumber() {
    const today = new Date();
    const startOfYear = new Date(today.getFullYear(), 0, 1);
    const days = Math.floor((today.getTime() - startOfYear.getTime()) /
                            (24 * 60 * 60 * 1000));
    return Math.ceil((days + 1) / 7);
}

export function getMonth(): number {
    const date = new Date();
    const month = date.getMonth() + 1;
    return month;
}

export function getMonthName(): string {
    const monthNames = [
        , "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    return monthNames[getMonth()] as string;
}

export function getYear(): number {
    const date = new Date();
    const year = date.getFullYear();
    return year;
}
