package usecase

import (
	"fmt"

	eventRepo "github.com/behzad/obvio/internal/domain/event/repository"
)

type InsightsResult struct {
	TotalEvents        int                      `json:"total_events"`
	TotalViolations    int                      `json:"total_violations"`
	ViolationRate      float64                  `json:"violation_rate"`
	ViolationBreakdown []ViolationBreakdownItem `json:"violation_breakdown"`
	EventsByDay        []EventsByDayItem        `json:"events_by_day"`
	EventsByHour       []EventsByHourItem       `json:"events_by_hour"`
	PeakHour           int                      `json:"peak_hour"`
	PeakDay            string                   `json:"peak_day"`
}

type ViolationBreakdownItem struct {
	Type  string `json:"type"`
	Count int    `json:"count"`
}

type EventsByDayItem struct {
	Date  string `json:"date"`
	Count int    `json:"count"`
}

type EventsByHourItem struct {
	Hour  int `json:"hour"`
	Count int `json:"count"`
}

type InsightsUsecase struct {
	eventRepo eventRepo.EventRepository
}

func NewInsightsUsecase(er eventRepo.EventRepository) *InsightsUsecase {
	return &InsightsUsecase{eventRepo: er}
}

func (u *InsightsUsecase) GetInsights(portalID uint) (*InsightsResult, error) {
	events, err := u.eventRepo.FindByPortalID(portalID)
	if err != nil {
		return nil, err
	}

	result := &InsightsResult{}
	result.TotalEvents = len(events)

	violationCounts := map[string]int{}
	dayCounts := map[string]int{}
	hourCounts := map[int]int{}

	for _, e := range events {
		if e.IsViolation {
			result.TotalViolations++
			if e.ViolationType != "" {
				violationCounts[e.ViolationType]++
			}
		}
		day := e.Timestamp.Format("2006-01-02")
		dayCounts[day]++
		hourCounts[e.Timestamp.Hour()]++
	}

	if result.TotalEvents > 0 {
		result.ViolationRate = float64(result.TotalViolations) / float64(result.TotalEvents) * 100
	}

	for vtype, count := range violationCounts {
		result.ViolationBreakdown = append(result.ViolationBreakdown, ViolationBreakdownItem{Type: vtype, Count: count})
	}

	for day, count := range dayCounts {
		result.EventsByDay = append(result.EventsByDay, EventsByDayItem{Date: day, Count: count})
	}

	peakHour, peakHourCount := 0, 0
	for hour, count := range hourCounts {
		result.EventsByHour = append(result.EventsByHour, EventsByHourItem{Hour: hour, Count: count})
		if count > peakHourCount {
			peakHourCount = count
			peakHour = hour
		}
	}
	result.PeakHour = peakHour
	result.PeakDay = fmt.Sprintf("%02d:00", peakHour)

	return result, nil
}
