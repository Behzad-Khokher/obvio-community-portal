package event

import "time"

type Event struct {
	ID            uint      `json:"id" gorm:"primaryKey"`
	TrialID       uint      `json:"trial_id"`
	VideoURL      string    `json:"video_url"`
	Timestamp     time.Time `json:"timestamp"`
	IsViolation   bool      `json:"is_violation"`
	ViolationType string    `json:"violation_type"`
	Duration      float64   `json:"duration"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}
