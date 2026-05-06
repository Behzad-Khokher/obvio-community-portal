package usecase

import (
	"github.com/behzad/obvio/internal/domain/annotation"
	annotationRepo "github.com/behzad/obvio/internal/domain/annotation/repository"
)

type AnnotationUsecase struct {
	repo annotationRepo.AnnotationRepository
}

func NewAnnotationUsecase(r annotationRepo.AnnotationRepository) *AnnotationUsecase {
	return &AnnotationUsecase{repo: r}
}

func (u *AnnotationUsecase) ListAnnotations(eventID uint) ([]annotation.Annotation, error) {
	return u.repo.FindByEventID(eventID)
}

func (u *AnnotationUsecase) CreateAnnotation(a *annotation.Annotation) error {
	return u.repo.Create(a)
}

func (u *AnnotationUsecase) UpdateAnnotation(id uint, input *annotation.Annotation) (*annotation.Annotation, error) {
	a, err := u.repo.FindByID(id)
	if err != nil {
		return nil, err
	}
	a.FrameTime = input.FrameTime
	a.X = input.X
	a.Y = input.Y
	a.Width = input.Width
	a.Height = input.Height
	a.Label = input.Label
	return a, u.repo.Update(a)
}

func (u *AnnotationUsecase) DeleteAnnotation(id uint) error {
	return u.repo.Delete(id)
}
