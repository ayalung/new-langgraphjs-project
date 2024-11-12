export function getNextWeekday(currentDay: Weekday): Weekday {
    const weekdays: Weekday[] = [
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
        'Sunday',
        null,
    ];

    const currentIndex = weekdays.indexOf(currentDay);
    if (currentIndex === -1 || currentIndex === weekdays.length - 1) {
        return null; // If input is invalid or already `null`
    }

    return weekdays[currentIndex + 1];
}