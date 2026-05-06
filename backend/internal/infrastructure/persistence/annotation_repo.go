package persistence

import (
	"github.com/behzad/obvio/internal/domain/annotation"
	"gorm.io/gorm"
)

type annotationRepo struct {
	db *gorm.DB
}

func NewAnnotationRepo(db *gorm.DB) *annotationRepo {
	return &annotationRepo{db: db}
}

func (r *annotationRepo) FindByEventID(eventID uint) ([]annotation.Annotation, error) {
	var annotations []annotation.Annotation
	err := r.db.Where("event_id = ?", eventID).Find(&annotations).Error
	return annotations, err
}

func (r *annotationRepo) FindByID(id uint) (*annotation.Annotation, error) {
	var a annotation.Annotation
	err := r.db.First(&a, id).Error
	return &a, err
}

func (r *annotationRepo) Create(a *annotation.Annotation) error {
	return r.db.Create(a).Error
}

func (r *annotationRepo) Update(a *annotation.Annotation) error {
	return r.db.Save(a).Error
}

func (r *annotationRepo) Delete(id uint) error {
	return r.db.Delete(&annotation.Annotation{}, id).Error
}
