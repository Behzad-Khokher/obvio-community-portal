package trial

import "time"

type Trial struct {
	ID          uint      `json:"id" gorm:"primaryKey"`
	PortalID    uint      `json:"portal_id"`
	Location    string    `json:"location"`
	StartDate   time.Time `json:"start_date"`
	EndDate     time.Time `json:"end_date"`
	Description string    `json:"description"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}
