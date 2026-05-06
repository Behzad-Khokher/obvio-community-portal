package persistence

import (
	"github.com/behzad/obvio/internal/domain/trial"
	"gorm.io/gorm"
)

type trialRepo struct {
	db *gorm.DB
}

func NewTrialRepo(db *gorm.DB) *trialRepo {
	return &trialRepo{db: db}
}

func (r *trialRepo) FindByPortalID(portalID uint) ([]trial.Trial, error) {
	var trials []trial.Trial
	err := r.db.Where("portal_id = ?", portalID).Find(&trials).Error
	return trials, err
}

func (r *trialRepo) FindByID(id uint) (*trial.Trial, error) {
	var t trial.Trial
	err := r.db.First(&t, id).Error
	return &t, err
}

func (r *trialRepo) Create(t *trial.Trial) error {
	return r.db.Create(t).Error
}

func (r *trialRepo) Update(t *trial.Trial) error {
	return r.db.Save(t).Error
}

func (r *trialRepo) Delete(id uint) error {
	return r.db.Delete(&trial.Trial{}, id).Error
}
