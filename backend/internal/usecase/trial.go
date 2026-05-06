package usecase

import (
	"github.com/behzad/obvio/internal/domain/trial"
	trialRepo "github.com/behzad/obvio/internal/domain/trial/repository"
)

type TrialUsecase struct {
	repo trialRepo.TrialRepository
}

func NewTrialUsecase(r trialRepo.TrialRepository) *TrialUsecase {
	return &TrialUsecase{repo: r}
}

func (u *TrialUsecase) ListTrials(portalID uint) ([]trial.Trial, error) {
	return u.repo.FindByPortalID(portalID)
}

func (u *TrialUsecase) GetTrial(id uint) (*trial.Trial, error) {
	return u.repo.FindByID(id)
}

func (u *TrialUsecase) CreateTrial(t *trial.Trial) error {
	return u.repo.Create(t)
}

func (u *TrialUsecase) UpdateTrial(id uint, input *trial.Trial) (*trial.Trial, error) {
	t, err := u.repo.FindByID(id)
	if err != nil {
		return nil, err
	}
	t.Location = input.Location
	t.StartDate = input.StartDate
	t.EndDate = input.EndDate
	t.Description = input.Description
	return t, u.repo.Update(t)
}

func (u *TrialUsecase) DeleteTrial(id uint) error {
	return u.repo.Delete(id)
}
