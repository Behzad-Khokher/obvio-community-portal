package database

import (
	"github.com/behzad/obvio/internal/domain/annotation"
	"github.com/behzad/obvio/internal/domain/event"
	"github.com/behzad/obvio/internal/domain/portal"
	"github.com/behzad/obvio/internal/domain/trial"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func NewSQLiteDB(dsn string) (*gorm.DB, error) {
	db, err := gorm.Open(sqlite.Open(dsn), &gorm.Config{})
	if err != nil {
		return nil, err
	}

	if err := db.AutoMigrate(
		&portal.Portal{},
		&trial.Trial{},
		&event.Event{},
		&annotation.Annotation{},
	); err != nil {
		return nil, err
	}

	return db, nil
}
