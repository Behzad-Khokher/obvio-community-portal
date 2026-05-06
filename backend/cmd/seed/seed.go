package main

import (
	"log"
	"os"
	"time"

	"github.com/behzad/obvio/internal/domain/annotation"
	"github.com/behzad/obvio/internal/domain/event"
	"github.com/behzad/obvio/internal/domain/portal"
	"github.com/behzad/obvio/internal/domain/trial"
	"github.com/behzad/obvio/internal/infrastructure/database"
	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("no .env file")
	}

	dsn := os.Getenv("DB_PATH")
	if dsn == "" {
		dsn = "obvio.db"
	}

	db, err := database.NewSQLiteDB(dsn)
	if err != nil {
		log.Fatalf("db: %v", err)
	}

	now := time.Now()

	portals := []portal.Portal{
		{Name: "Downtown Intersection Safety", Location: "Main St & 1st Ave, Springfield", Description: "Monitoring pedestrian crossings and vehicle violations at the city's busiest intersection."},
		{Name: "School Zone Crosswalk Study", Location: "Oak Elementary, 200 Oak Rd", Description: "Tracking vehicle behavior near school crosswalks during drop-off and pick-up hours."},
	}
	for i := range portals {
		if err := db.Create(&portals[i]).Error; err != nil {
			log.Fatalf("seed portal: %v", err)
		}
	}

	trials := []trial.Trial{
		{PortalID: portals[0].ID, Location: "North approach, Main St", StartDate: now.AddDate(0, -2, 0), EndDate: now.AddDate(0, -1, 0), Description: "Morning rush hour monitoring, 7AM-9AM"},
		{PortalID: portals[0].ID, Location: "South approach, 1st Ave", StartDate: now.AddDate(0, -1, 0), EndDate: now, Description: "Evening rush hour monitoring, 4PM-7PM"},
		{PortalID: portals[1].ID, Location: "East crosswalk, Oak Rd", StartDate: now.AddDate(0, -1, -15), EndDate: now.AddDate(0, 0, -7), Description: "School zone morning session"},
	}
	for i := range trials {
		if err := db.Create(&trials[i]).Error; err != nil {
			log.Fatalf("seed trial: %v", err)
		}
	}

	trafficVideo := "/videos/raw/14620690_960_540_30fps.mp4"
	sampleVideos := []string{trafficVideo, trafficVideo, trafficVideo, trafficVideo, trafficVideo, trafficVideo}

	events := []event.Event{
		{TrialID: trials[0].ID, VideoURL: sampleVideos[0], Timestamp: now.Add(-48 * time.Hour).Add(7 * time.Hour), IsViolation: true, ViolationType: "red_light", Duration: 12.5},
		{TrialID: trials[0].ID, VideoURL: sampleVideos[1], Timestamp: now.Add(-47 * time.Hour).Add(7*time.Hour + 30*time.Minute), IsViolation: false, ViolationType: "", Duration: 8.2},
		{TrialID: trials[0].ID, VideoURL: sampleVideos[2], Timestamp: now.Add(-46 * time.Hour).Add(8 * time.Hour), IsViolation: true, ViolationType: "speeding", Duration: 15.0},
		{TrialID: trials[1].ID, VideoURL: sampleVideos[3], Timestamp: now.Add(-24 * time.Hour).Add(16 * time.Hour), IsViolation: true, ViolationType: "crosswalk", Duration: 10.1},
		{TrialID: trials[1].ID, VideoURL: sampleVideos[4], Timestamp: now.Add(-23 * time.Hour).Add(17 * time.Hour), IsViolation: false, ViolationType: "", Duration: 9.3},
		{TrialID: trials[2].ID, VideoURL: sampleVideos[5], Timestamp: now.Add(-10 * 24 * time.Hour).Add(8 * time.Hour), IsViolation: true, ViolationType: "speeding", Duration: 11.7},
	}
	for i := range events {
		if err := db.Create(&events[i]).Error; err != nil {
			log.Fatalf("seed event: %v", err)
		}
	}

	annotations := []annotation.Annotation{
		{EventID: events[0].ID, FrameTime: 2.5, X: 0.3, Y: 0.4, Width: 0.2, Height: 0.15, Label: "car"},
		{EventID: events[0].ID, FrameTime: 2.5, X: 0.6, Y: 0.7, Width: 0.05, Height: 0.1, Label: "pedestrian"},
		{EventID: events[2].ID, FrameTime: 5.0, X: 0.45, Y: 0.35, Width: 0.25, Height: 0.18, Label: "truck"},
		{EventID: events[3].ID, FrameTime: 3.2, X: 0.2, Y: 0.5, Width: 0.15, Height: 0.12, Label: "car"},
	}
	for i := range annotations {
		if err := db.Create(&annotations[i]).Error; err != nil {
			log.Fatalf("seed annotation: %v", err)
		}
	}

	log.Println("seed complete")
}
